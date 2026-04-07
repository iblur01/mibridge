import { Command } from 'commander'
import { PetFountainClient, FountainMode } from '@mibridge/core'
import type { FountainStatus } from '@mibridge/core'
import { requireSession, getRegion } from '../session.js'
import { t } from '../i18n.js'

const MODE_MAP: Record<string, FountainMode> = {
  continuous:   FountainMode.Continuous,
  intermittent: FountainMode.Intermittent,
  sensor:       FountainMode.Sensor,
}

export function register(program: Command): void {
  const fountain = new Command('fountain')
  fountain.description(t('fountain.description'))

  // ── status ──────────────────────────────────────────────────────────────────
  fountain
    .command('status <device>')
    .description(t('fountain.status.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new PetFountainClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        const status = await client.getStatus()
        console.log(t('fountain.status.header'))
        for (const [key, val] of Object.entries(status)) {
          if (val === null || val === undefined) continue
          let displayVal: string | number | boolean = val
          if (key === 'filterLifeLeft' && typeof val === 'number') {
            displayVal = `${val}%`
          } else if (key === 'filterLeftTime' && typeof val === 'number') {
            displayVal = `${val} day${val === 1 ? '' : 's'}`
          }
          console.log(`  ${key.padEnd(20)}: ${displayVal}`)
        }
        console.log()
      } catch (e) {
        console.error(t('fountain.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── on ──────────────────────────────────────────────────────────────────────
  fountain
    .command('on <device>')
    .description(t('fountain.on.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new PetFountainClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setOn(true)
        console.log(t('fountain.on.success'))
      } catch (e) {
        console.error(t('fountain.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── off ─────────────────────────────────────────────────────────────────────
  fountain
    .command('off <device>')
    .description(t('fountain.off.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new PetFountainClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setOn(false)
        console.log(t('fountain.off.success'))
      } catch (e) {
        console.error(t('fountain.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── set-mode ─────────────────────────────────────────────────────────────────
  fountain
    .command('set-mode <device> <mode>')
    .description(t('fountain.setMode.description'))
    .action(async (deviceId: string, modeStr: string) => {
      const mode = MODE_MAP[modeStr.toLowerCase()]
      if (mode === undefined) {
        console.error(t('fountain.setMode.invalid', { mode: modeStr }))
        process.exit(1)
      }
      const session = requireSession()
      const client = new PetFountainClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setMode(mode)
        console.log(t('fountain.setMode.success', { mode: modeStr }))
      } catch (e) {
        console.error(t('fountain.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── reset-filter ─────────────────────────────────────────────────────────────
  fountain
    .command('reset-filter <device>')
    .description(t('fountain.resetFilter.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new PetFountainClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.resetFilter()
        console.log(t('fountain.resetFilter.success'))
      } catch (e) {
        console.error(t('fountain.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── watch ────────────────────────────────────────────────────────────────────
  fountain
    .command('watch <device>')
    .description(t('fountain.watch.description'))
    .option('--interval <ms>', t('fountain.watch.option.interval'), '30000')
    .action(async (deviceId: string, opts: { interval: string }) => {
      const session = requireSession()
      const pollInterval = parseInt(opts.interval, 10) || 30_000
      const client = new PetFountainClient({ deviceId, session, region: getRegion(), pollInterval })

      client.on('statusChange', (s: FountainStatus) => {
        const ts = new Date().toISOString().slice(11, 19)
        console.log(t('fountain.watch.status', {
          time: ts, on: String(s.on), mode: String(s.mode),
          battery: s.batteryLevel, filter: s.filterLifeLeft,
        }))
      })
      client.on('faultChange', (fault: string) => console.log(t('fountain.watch.faultChange', { fault })))
      client.on('waterShortage', (shortage: boolean) => console.log(t('fountain.watch.waterShortage', { shortage: String(shortage) })))
      client.on('modeChange', (mode: string) => console.log(t('fountain.watch.modeChange', { mode })))
      client.on('error', (e: Error) => console.error(t('fountain.error', { message: e.message })))

      await client.connect()
      console.log(t('fountain.watch.intro', { deviceId, interval: pollInterval }))

      process.on('SIGINT', async () => {
        await client.disconnect()
        process.exit(0)
      })
    })

  program.addCommand(fountain)
}
