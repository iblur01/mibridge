import type { Command } from 'commander'
import { DreameVacuumClient } from '@mibridge/core'
import type { VacuumStatus, OperationResult } from '@mibridge/core'
import { requireSession, getRegion } from '../session.js'
import { t } from '../i18n.js'

export function register(program: Command): void {
  program
    .command('watch <device>')
    .description(t('watch.description'))
    .option('--interval <ms>', t('watch.option.interval'), '3000')
    .action(async (deviceId: string, opts: { interval: string }) => {
      const session = requireSession()
      const pollInterval = parseInt(opts.interval, 10) || 3000
      const client = new DreameVacuumClient({ deviceId, session, region: getRegion(), pollInterval })

      client.on('statusChange', (s: VacuumStatus) => {
        const ts = new Date().toISOString().slice(11, 19)
        console.log(t('watch.status', { time: ts, state: s.state, battery: s.batteryLevel, mode: s.cleanMode }))
      })
      client.on('stateChange', (state: string) => console.log(t('watch.stateChange', { state })))
      client.on('cleanModeChange', (mode: string) => console.log(t('watch.modeChange', { mode })))
      client.on('operationComplete', (r: OperationResult) => {
        console.log(t('watch.operationComplete', { error: r.completionErrorCode, duration: r.totalOperationalTime ?? 0 }))
      })
      client.on('error', (e: Error) => console.error(t('watch.error', { message: e.message })))

      await client.connect()
      console.log(t('watch.intro', { deviceId, interval: pollInterval }))

      process.on('SIGINT', async () => {
        await client.disconnect()
        process.exit(0)
      })
    })
}
