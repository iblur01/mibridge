import type { Command } from 'commander'
import { DreameVacuumClient } from '@mibridge/core'
import { requireSession, getRegion } from '../session.js'
import { t } from '../i18n.js'

export function register(program: Command): void {
  program
    .command('rooms <device>')
    .description(t('rooms.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new DreameVacuumClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        const areas = await client.getAreas()
        if (!areas || areas.length === 0) {
          console.log(t('rooms.none'))
          return
        }
        console.log(t('rooms.header'))
        console.log('─'.repeat(40))
        for (const a of areas) {
          console.log(`  ID ${String(a.id).padEnd(4)} ${a.name}`)
        }
        console.log('─'.repeat(40))
        console.log(t('rooms.hint', { deviceId }))
      } catch (e) {
        console.error(t('rooms.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })
}
