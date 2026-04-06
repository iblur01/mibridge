import type { Command } from 'commander'
import { DreameVacuumClient } from '@mibridge/core'
import { requireSession, getRegion } from '../session.js'
import { t } from '../i18n.js'

const ACTIONS = ['start', 'pause', 'resume', 'stop', 'returnToDock', 'startMapping'] as const
type ActionName = typeof ACTIONS[number]

export function register(program: Command): void {
  program
    .command('do <device> <action>')
    .description(t('do.description', { actions: ACTIONS.join(', ') }))
    .action(async (deviceId: string, action: string) => {
      if (!(ACTIONS as readonly string[]).includes(action)) {
        console.error(t('do.unknownAction', { action, actions: ACTIONS.join(', ') }))
        process.exit(1)
      }
      const session = requireSession()
      const client = new DreameVacuumClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await (client[action as ActionName] as () => Promise<void>)()
        console.log(t('do.success', { action }))
      } catch (e) {
        console.error(t('do.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })
}
