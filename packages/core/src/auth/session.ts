import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import type { Session } from '../types.js'

function getSessionPath(): string {
  const dir = process.env['XIAOMI_SESSION_DIR']
    ?? join(homedir(), '.config', 'xiaomi-cli')
  return join(dir, 'session.json')
}

export function saveSession(session: Session): void {
  const path = getSessionPath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(session, null, 2), 'utf8')
}

export function loadSession(): Session | null {
  const path = getSessionPath()
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as Session
}

export function clearSession(): void {
  const path = getSessionPath()
  if (existsSync(path)) unlinkSync(path)
}
