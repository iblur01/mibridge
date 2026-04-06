import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import { createHash, randomBytes } from 'node:crypto'
import type { Session } from '../types.js'

const SERVICE_LOGIN_URL = 'https://account.xiaomi.com/pass/serviceLogin'
const SERVICE_LOGIN_AUTH2_URL = 'https://account.xiaomi.com/pass/serviceLoginAuth2'
const USER_AGENT = 'APP/com.xiaomi.mihome APPV/6.0.89 Channel/MI-COM-BD-00059-00 OSVersion/MIUI-12.0.1 Android/28'

export class MiCloudAuth {
  private region: string
  private jar: CookieJar
  private client: ReturnType<typeof axios.create>
  private clientId: string
  session: Session | null = null

  constructor(region = 'de') {
    this.region = region
    this.jar = new CookieJar()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.client = wrapper(axios.create({ jar: this.jar } as any) as any) as ReturnType<typeof axios.create>
    this.clientId = randomBytes(3).toString('hex').toUpperCase()

    for (const domain of ['mi.com', 'xiaomi.com']) {
      this.jar.setCookieSync(`sdkVersion=3.8.6; Domain=${domain}`, `https://${domain}`)
      this.jar.setCookieSync(`deviceId=${this.clientId}; Domain=${domain}`, `https://${domain}`)
    }
  }

  async login(username: string, password: string): Promise<{ needs2FA: boolean; notificationUrl?: string }> {
    const hash = createHash('md5').update(password).digest('hex').toUpperCase()

    const { data: signData } = await this.client.get(SERVICE_LOGIN_URL, {
      params: { sid: 'xiaomiio', _json: 'true' },
      headers: { 'User-Agent': USER_AGENT },
      transformResponse: [(raw: unknown) => this._parseXiaomiJson(raw)],
    })

    const formData = new URLSearchParams({
      _json: 'true',
      user: username,
      hash,
      sid: 'xiaomiio',
      callback: signData.callback || this._stsUrl(),
      _sign: signData._sign,
      qs: signData.qs || '%3Fsid%3Dxiaomiio%26_json%3Dtrue',
    })

    const loginResp = await this.client.post(
      SERVICE_LOGIN_AUTH2_URL,
      formData.toString(),
      {
        headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
        transformResponse: [(raw: unknown) => this._parseXiaomiJson(raw)],
      },
    )
    const loginData = loginResp.data

    if (loginData.notificationUrl) {
      return { needs2FA: true, notificationUrl: loginData.notificationUrl }
    }

    await this._finalizeSession(loginData)
    return { needs2FA: false }
  }

  async submitOTP(notificationUrl: string, otpCode: string): Promise<void> {
    const AUTH_START = 'fe/service/identity/authStart'
    const baseUrl = notificationUrl.split('/fe/service')[0]!

    const listResp = await this.client.get(
      notificationUrl.replace(AUTH_START, 'identity/list'),
      { headers: { 'User-Agent': USER_AGENT }, transformResponse: [(raw: unknown) => this._parseXiaomiJson(raw)] },
    )

    const flag: number = listResp.data?.flag ?? 4
    const verifyEndpoint = flag === 4 ? '/identity/auth/verifyPhone' : '/identity/auth/verifyEmail'

    const verifyResp = await this.client.post(
      `${baseUrl}${verifyEndpoint}`,
      new URLSearchParams({ _flag: String(flag), ticket: otpCode, trust: 'true', _json: 'true' }).toString(),
      {
        params: { _dc: Date.now() },
        headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
        transformResponse: [(raw: unknown) => this._parseXiaomiJson(raw)],
      },
    )

    if (verifyResp.data?.code !== 0) throw new Error('Incorrect OTP code')

    await this.client.get(verifyResp.data.location, { headers: { 'User-Agent': USER_AGENT }, maxRedirects: 10 }).catch(() => {})

    const step1Data = await this._loginStep1()
    if (!step1Data?.location) throw new Error('OTP verification failed — please run login again')

    const serviceToken = await this._fetchServiceToken(step1Data['location'] as string)
    if (!serviceToken) throw new Error('Failed to retrieve serviceToken')

    this.session = {
      userId: String(step1Data['userId']),
      ssecurity: String(step1Data['ssecurity']),
      serviceToken,
      savedAt: new Date().toISOString(),
    }
  }

  private async _loginStep1(): Promise<Record<string, unknown>> {
    const { data } = await this.client.get(SERVICE_LOGIN_URL, {
      params: { sid: 'xiaomiio', _json: 'true' },
      headers: { 'User-Agent': USER_AGENT },
      transformResponse: [(raw: unknown) => this._parseXiaomiJson(raw)],
    })
    return data
  }

  private async _finalizeSession(loginData: Record<string, unknown>): Promise<void> {
    const serviceToken = await this._fetchServiceToken(loginData['location'] as string)
    this.session = {
      userId: String(loginData['userId']),
      ssecurity: String(loginData['ssecurity']),
      serviceToken: serviceToken ?? '',
      savedAt: new Date().toISOString(),
    }
  }

  private _parseXiaomiJson(raw: unknown): unknown {
    if (typeof raw !== 'string') return raw
    const str = raw.startsWith('&&&START&&&') ? raw.slice('&&&START&&&'.length) : raw
    try { return JSON.parse(str) } catch { return raw }
  }

  private _stsUrl(): string {
    return this.region === 'cn'
      ? 'https://sts.api.io.mi.com/sts'
      : `https://${this.region}.sts.api.io.mi.com/sts`
  }

  private async _fetchServiceToken(location: string): Promise<string | null> {
    if (!location) return null
    try {
      await this.client.get(location, { headers: { 'User-Agent': USER_AGENT }, maxRedirects: 10 })
    } catch { /* redirect errors expected */ }
    let stsOrigin: string
    try { stsOrigin = new URL(location).origin } catch { stsOrigin = this._stsUrl().replace('/sts', '') }
    const cookies = await this.jar.getCookies(stsOrigin)
    return cookies.find(c => c.key === 'serviceToken')?.value ?? null
  }
}
