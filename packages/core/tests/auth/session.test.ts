import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mkdirSync, rmSync } from 'node:fs'

// Override SESSION_PATH via env to avoid touching real ~/.config
const tmpDir = join(tmpdir(), 'xiaomi-session-test-' + Date.now())
process.env['XIAOMI_SESSION_DIR'] = tmpDir

import { saveSession, loadSession, clearSession } from '../../src/auth/session.js'
import type { Session } from '../../src/types.js'

const mockSession: Session = {
  userId: '12345',
  ssecurity: 'abc',
  serviceToken: 'tok',
  savedAt: '2026-01-01T00:00:00.000Z',
}

describe('session', () => {
  beforeEach(() => mkdirSync(tmpDir, { recursive: true }))
  afterEach(() => rmSync(tmpDir, { recursive: true, force: true }))

  test('saveSession writes JSON and loadSession reads it back', () => {
    saveSession(mockSession)
    const loaded = loadSession()
    expect(loaded).toEqual(mockSession)
  })

  test('loadSession returns null when no session file', () => {
    expect(loadSession()).toBeNull()
  })

  test('clearSession removes the file', () => {
    saveSession(mockSession)
    clearSession()
    expect(loadSession()).toBeNull()
  })
})
