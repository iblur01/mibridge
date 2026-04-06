import type { Command } from 'commander'
import { DreameVacuumClient, CleanMode } from '@mibridge/core'
import { requireSession, getRegion } from '../session.js'
import { t } from '../i18n.js'

const SUCTION_MAP: Record<string, number> = { quiet: 0, standard: 1, strong: 2, turbo: 3 }
const WATER_MAP: Record<string, number>   = { low: 1, medium: 2, high: 3 }

export function register(program: Command): void {
  program
    .command('clean <device>')
    .description(t('clean.description'))
    .option('--rooms <ids>',    t('clean.option.rooms'))
    .option('--mode <mode>',    t('clean.option.mode'), 'vacuum')
    .option('--suction <lvl>',  t('clean.option.suction'), 'strong')
    .option('--water <lvl>',    t('clean.option.water'), 'medium')
    .option('--repeat <n>',     t('clean.option.repeat'), '1')
    .action(async (deviceId: string, opts: {
      rooms?: string; mode: string;
      suction: string; water: string; repeat: string
    }) => {
      const session = requireSession()
      const client = new DreameVacuumClient({ deviceId, session, region: getRegion() })

      const options = {
        suction: SUCTION_MAP[opts.suction] ?? 2,
        water:   WATER_MAP[opts.water]     ?? 2,
        repeat:  parseInt(opts.repeat, 10) || 1,
      }

      const modeMap: Record<string, CleanMode> = {
        vacuum:        CleanMode.Vacuum,
        mop:           CleanMode.Mop,
        vacuumThenMop: CleanMode.VacuumThenMop,
      }

      try {
        await client.connect()

        if (opts.rooms) {
          const ids = opts.rooms.split(',').map(id => id.trim())
          if (opts.mode && modeMap[opts.mode]) await client.setCleanMode(modeMap[opts.mode]!)
          await client.startCleaningAreas(ids, options)
          console.log(t('clean.rooms.success', { ids: ids.join(', ') }))
        } else {
          await client.start()
          console.log(t('clean.full.success'))
        }
      } catch (e) {
        console.error(t('clean.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })
}
