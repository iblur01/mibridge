import { loadSession } from '@mibridge/core'
import type { Session } from '@mibridge/core'
import { t } from './i18n.js'

export function requireSession(): Session {
  const session = loadSession()
  if (!session) {
    console.error(t('session.notLoggedIn'))
    process.exit(1)
  }
  return session
}

export function getRegion(): string {
  return process.env['XIAOMI_REGION'] ?? 'de'
}
