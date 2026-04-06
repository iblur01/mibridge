jest.mock('axios-cookiejar-support', () => ({
  wrapper: (instance) => instance
}))
jest.mock('tough-cookie', () => ({
  CookieJar: jest.fn().mockImplementation(() => ({
    setCookieSync: jest.fn(),
    getCookies: jest.fn().mockResolvedValue([
      { key: 'identity_session', value: 'id_sess_mock' },
      { key: 'serviceToken', value: 'svc_tok_123' }
    ])
  }))
}))

const axios = require('axios')
jest.mock('axios')

const MiCloudAuth = require('../../src/auth/MiCloudAuth')

describe('MiCloudAuth', () => {
  beforeEach(() => jest.clearAllMocks())

  test('login without 2FA stores session with userId, ssecurity, serviceToken', async () => {
    const mockClient = {
      get: jest.fn()
        .mockResolvedValueOnce({ data: { _sign: 'sign123', qs: '%3F', callback: 'https://sts.api.io.mi.com/sts' } })
        .mockResolvedValueOnce({ data: {} }),
      post: jest.fn().mockResolvedValueOnce({
        data: { result: 'ok', ssecurity: 'sec_abc', userId: 999, nonce: 1, location: 'https://sts.api.io.mi.com/sts?nonce=1' }
      })
    }
    axios.create.mockReturnValue(mockClient)

    const auth = new MiCloudAuth()
    const result = await auth.login('user@example.com', 'password123')

    expect(result.needs2FA).toBe(false)
    expect(auth.session.userId).toBe('999')
    expect(auth.session.ssecurity).toBe('sec_abc')
    expect(auth.session.serviceToken).toBe('svc_tok_123')
    expect(auth.session.savedAt).toBeDefined()
  })

  test('login with 2FA returns needs2FA:true and notificationUrl', async () => {
    const mockClient = {
      get: jest.fn().mockResolvedValueOnce({
        data: { _sign: 'sign123', qs: '%3F', callback: 'https://sts.api.io.mi.com/sts' }
      }),
      post: jest.fn().mockResolvedValueOnce({
        data: {
          result: 'error',
          notificationUrl: 'https://account.xiaomi.com/security/auth2',
          _sign: 'sign456',
          ssecurity: 'sec_abc',
          userId: 999
        }
      })
    }
    axios.create.mockReturnValue(mockClient)

    const auth = new MiCloudAuth()
    const result = await auth.login('user@example.com', 'password123')

    expect(result.needs2FA).toBe(true)
    expect(result.notificationUrl).toBe('https://account.xiaomi.com/security/auth2')
    expect(auth._pendingUserId).toBe('999')
    expect(auth._pendingSecurityToken).toBe('sec_abc')
  })

  test('submitOTP completes auth after 2FA (dreame flow)', async () => {
    const notificationUrl = 'https://account.xiaomi.com/fe/service/identity/authStart?foo=1'
    const mockClient = {
      get: jest.fn()
        // 1. GET identity/list → flag=4
        .mockResolvedValueOnce({ data: { flag: 4 } })
        // 3. GET location (activate 2FA approval)
        .mockResolvedValueOnce({ data: {} })
        // 4. Re-login step1 → code=0, userId, ssecurity, location
        .mockResolvedValueOnce({ data: { code: 0, userId: 999, ssecurity: 'sec_abc', location: 'https://sts.api.io.mi.com/sts?n=2' } })
        // 5. _fetchServiceToken GET
        .mockResolvedValueOnce({ data: {} }),
      post: jest.fn()
        // 2. POST verifyPhone → code=0, location
        .mockResolvedValueOnce({ data: { code: 0, location: 'https://account.xiaomi.com/done' } })
    }
    axios.create.mockReturnValue(mockClient)

    const auth = new MiCloudAuth()
    await auth.submitOTP(notificationUrl, '123456')

    // GET identity/list called first
    expect(mockClient.get.mock.calls[0][0]).toContain('identity/list')
    // POST to verifyPhone with ticket
    expect(mockClient.post.mock.calls[0][0]).toContain('/identity/auth/verifyPhone')
    expect(mockClient.post.mock.calls[0][1]).toContain('ticket=123456')
    // Session set correctly from step1 data
    expect(auth.session.userId).toBe('999')
    expect(auth.session.ssecurity).toBe('sec_abc')
    expect(auth.session.serviceToken).toBe('svc_tok_123')
  })
})
