import type { Command } from 'commander'
import { DreameVacuumClient } from '@mibridge/core'
import { requireSession, getRegion } from '../session.js'
import { t } from '../i18n.js'

export function register(program: Command): void {
  program
    .command('maps <device>')
    .description(t('maps.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new DreameVacuumClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        const maps = await client.getMaps()
        if (!maps.length) { console.log(t('maps.none')); return }
        for (const map of maps) {
          console.log(t('maps.map', { name: map.name, id: map.id }))
          console.log('─'.repeat(40))
          for (const a of map.areas) {
            console.log(`  ID ${String(a.id).padEnd(4)} ${a.name}`)
          }
        }
        console.log()
      } catch (e) {
        console.error(t('maps.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })
}
