import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('axios-cookiejar-support', () => ({ wrapper: (i: unknown) => i }))
vi.mock('tough-cookie', () => ({
  CookieJar: vi.fn().mockImplementation(() => ({
    setCookieSync: vi.fn(),
    getCookies: vi.fn().mockResolvedValue([
      { key: 'serviceToken', value: 'svc_tok_123' },
    ]),
  })),
}))
vi.mock('axios', () => ({
  default: { create: vi.fn() },
}))

import axios from 'axios'
import { MiCloudAuth } from '../../src/auth/MiCloudAuth.js'

const mockCreate = vi.mocked(axios.create)

describe('MiCloudAuth', () => {
  beforeEach(() => vi.clearAllMocks())

  test('login without 2FA stores session with userId, ssecurity, serviceToken', async () => {
    const mockClient = {
      get: vi.fn()
        .mockResolvedValueOnce({ data: { _sign: 'sign123', qs: '%3F', callback: 'https://sts.api.io.mi.com/sts' } })
        .mockResolvedValueOnce({ data: {} }),
      post: vi.fn().mockResolvedValueOnce({
        data: { result: 'ok', ssecurity: 'sec_abc', userId: 999, nonce: 1, location: 'https://sts.api.io.mi.com/sts?nonce=1' },
      }),
    }
    mockCreate.mockReturnValue(mockClient as never)

    const auth = new MiCloudAuth()
    const result = await auth.login('user@example.com', 'password123')

    expect(result.needs2FA).toBe(false)
    expect(auth.session!.userId).toBe('999')
    expect(auth.session!.ssecurity).toBe('sec_abc')
    expect(auth.session!.serviceToken).toBe('svc_tok_123')
    expect(auth.session!.savedAt).toBeDefined()
  })

  test('login with 2FA returns needs2FA:true and notificationUrl', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce({
        data: { _sign: 'sign123', qs: '%3F', callback: 'https://sts.api.io.mi.com/sts' },
      }),
      post: vi.fn().mockResolvedValueOnce({
        data: {
          notificationUrl: 'https://account.xiaomi.com/security/auth2',
          _sign: 'sign456',
          ssecurity: 'sec_abc',
          userId: 999,
        },
      }),
    }
    mockCreate.mockReturnValue(mockClient as never)

    const auth = new MiCloudAuth()
    const result = await auth.login('user@example.com', 'password123')

    expect(result.needs2FA).toBe(true)
    expect(result.notificationUrl).toBe('https://account.xiaomi.com/security/auth2')
  })

  test('submitOTP completes auth after 2FA', async () => {
    const notificationUrl = 'https://account.xiaomi.com/fe/service/identity/authStart?foo=1'
    const mockClient = {
      get: vi.fn()
        .mockResolvedValueOnce({ data: { flag: 4 } })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: { code: 0, userId: 999, ssecurity: 'sec_abc', location: 'https://sts.api.io.mi.com/sts?n=2' } })
        .mockResolvedValueOnce({ data: {} }),
      post: vi.fn()
        .mockResolvedValueOnce({ data: { code: 0, location: 'https://account.xiaomi.com/done' } }),
    }
    mockCreate.mockReturnValue(mockClient as never)

    const auth = new MiCloudAuth()
    await auth.submitOTP(notificationUrl, '123456')

    expect(mockClient.get.mock.calls[0]![0]).toContain('identity/list')
    expect(mockClient.post.mock.calls[0]![0]).toContain('/identity/auth/verifyPhone')
    expect(String(mockClient.post.mock.calls[0]![1])).toContain('ticket=123456')
    expect(auth.session!.userId).toBe('999')
    expect(auth.session!.serviceToken).toBe('svc_tok_123')
  })
})
