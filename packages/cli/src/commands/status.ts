import type { Command } from 'commander'
import { DreameVacuumClient } from '@mibridge/core'
import { requireSession, getRegion } from '../session.js'
import { t } from '../i18n.js'

export function register(program: Command): void {
  program
    .command('status <device>')
    .description(t('status.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new DreameVacuumClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        const status = await client.getStatus()
        console.log(t('status.header'))
        for (const [key, val] of Object.entries(status)) {
          if (val === null || val === undefined) continue
          console.log(`  ${key.padEnd(20)}: ${val}`)
        }
        console.log()
      } catch (e) {
        console.error(t('status.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })
}
