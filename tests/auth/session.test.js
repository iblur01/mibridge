const os = require('os')
const path = require('path')

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  unlinkSync: jest.fn()
}))

const fs = require('fs')
const { saveSession, loadSession, clearSession, SESSION_PATH } = require('../../src/auth/session')

describe('session', () => {
  beforeEach(() => jest.clearAllMocks())

  test('SESSION_PATH is in ~/.config/xiaomi-cli/', () => {
    expect(SESSION_PATH).toContain(path.join('.config', 'xiaomi-cli'))
    expect(SESSION_PATH).toContain('session.json')
  })

  test('saveSession writes JSON to disk', () => {
    const session = { userId: '123', ssecurity: 'abc', serviceToken: 'tok', savedAt: '2026-01-01' }
    saveSession(session)
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(SESSION_PATH), { recursive: true })
    expect(fs.writeFileSync).toHaveBeenCalledWith(SESSION_PATH, JSON.stringify(session, null, 2), 'utf8')
  })

  test('loadSession returns parsed JSON when file exists', () => {
    const session = { userId: '123', ssecurity: 'abc', serviceToken: 'tok' }
    fs.existsSync.mockReturnValue(true)
    fs.readFileSync.mockReturnValue(JSON.stringify(session))
    expect(loadSession()).toEqual(session)
  })

  test('loadSession returns null when file does not exist', () => {
    fs.existsSync.mockReturnValue(false)
    expect(loadSession()).toBeNull()
  })

  test('clearSession deletes file when it exists', () => {
    fs.existsSync.mockReturnValue(true)
    clearSession()
    expect(fs.unlinkSync).toHaveBeenCalledWith(SESSION_PATH)
  })
})
