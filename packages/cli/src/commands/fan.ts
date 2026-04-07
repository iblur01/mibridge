import { Command } from 'commander'
import { FanClient, FanMode } from '@mibridge/core'
import type { FanStatus, FanSpeed } from '@mibridge/core'
import { requireSession, getRegion } from '../session.js'
import { t } from '../i18n.js'

function parseBool(val: string): boolean | undefined {
  if (val === 'on') return true
  if (val === 'off') return false
  return undefined
}

function formatSpeed(speed: FanSpeed): string {
  return speed.type === 'level' ? String(speed.value) : `${speed.value}%`
}

export function register(program: Command): void {
  const fan = new Command('fan')
  fan.description(t('fan.description'))

  // ── status ──────────────────────────────────────────────────────────────────
  fan
    .command('status <device>')
    .description(t('fan.status.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        const status = await client.getStatus()
        console.log(t('fan.status.header'))
        for (const [key, val] of Object.entries(status)) {
          if (val === null || val === undefined) continue
          const displayVal = key === 'speed' ? formatSpeed(val as FanSpeed) : val
          console.log(`  ${key.padEnd(20)}: ${displayVal}`)
        }
        console.log()
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── on ──────────────────────────────────────────────────────────────────────
  fan
    .command('on <device>')
    .description(t('fan.on.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setOn(true)
        console.log(t('fan.on.success'))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── off ─────────────────────────────────────────────────────────────────────
  fan
    .command('off <device>')
    .description(t('fan.off.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setOn(false)
        console.log(t('fan.off.success'))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── toggle ──────────────────────────────────────────────────────────────────
  fan
    .command('toggle <device>')
    .description(t('fan.toggle.description'))
    .action(async (deviceId: string) => {
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.toggle()
        console.log(t('fan.toggle.success'))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── set-speed ────────────────────────────────────────────────────────────────
  fan
    .command('set-speed <device> <level>')
    .description(t('fan.setSpeed.description'))
    .action(async (deviceId: string, levelStr: string) => {
      const level = parseInt(levelStr, 10)
      if (isNaN(level) || level < 1 || level > 3) {
        console.error(t('fan.setSpeed.invalid', { level: levelStr }))
        process.exit(1)
      }
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setSpeed({ type: 'level', value: level })
        console.log(t('fan.setSpeed.success', { level: levelStr }))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── set-mode ─────────────────────────────────────────────────────────────────
  fan
    .command('set-mode <device> <mode>')
    .description(t('fan.setMode.description'))
    .action(async (deviceId: string, modeStr: string) => {
      const modeMap: Record<string, FanMode> = {
        straight: FanMode.Straight,
        sleep:    FanMode.Sleep,
      }
      const mode = modeMap[modeStr.toLowerCase()]
      if (mode === undefined) {
        console.error(t('fan.setMode.invalid', { mode: modeStr }))
        process.exit(1)
      }
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setMode(mode)
        console.log(t('fan.setMode.success', { mode: modeStr }))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── oscillate ────────────────────────────────────────────────────────────────
  fan
    .command('oscillate <device> <on|off>')
    .description(t('fan.oscillate.description'))
    .action(async (deviceId: string, val: string) => {
      const on = parseBool(val)
      if (on === undefined) {
        console.error(t('fan.oscillate.invalid', { value: val }))
        process.exit(1)
      }
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setOscillating(on)
        console.log(t('fan.oscillate.success', { value: val }))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── set-timer ────────────────────────────────────────────────────────────────
  fan
    .command('set-timer <device> <minutes>')
    .description(t('fan.setTimer.description'))
    .action(async (deviceId: string, minutesStr: string) => {
      const minutes = parseInt(minutesStr, 10)
      if (isNaN(minutes) || minutes < 0 || minutes > 480) {
        console.error(t('fan.error', { message: `Invalid minutes: ${minutesStr}. Range: 0–480` }))
        process.exit(1)
      }
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setTimer(minutes)
        console.log(t('fan.setTimer.success', { minutes: minutesStr }))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── set-buzzer ───────────────────────────────────────────────────────────────
  fan
    .command('set-buzzer <device> <on|off>')
    .description(t('fan.setBuzzer.description'))
    .action(async (deviceId: string, val: string) => {
      const on = parseBool(val)
      if (on === undefined) {
        console.error(t('fan.setBuzzer.invalid', { value: val }))
        process.exit(1)
      }
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setBuzzer(on)
        console.log(t('fan.setBuzzer.success', { value: val }))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── set-led ──────────────────────────────────────────────────────────────────
  fan
    .command('set-led <device> <on|off>')
    .description(t('fan.setLed.description'))
    .action(async (deviceId: string, val: string) => {
      const on = parseBool(val)
      if (on === undefined) {
        console.error(t('fan.setLed.invalid', { value: val }))
        process.exit(1)
      }
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setLed(on)
        console.log(t('fan.setLed.success', { value: val }))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── set-lock ─────────────────────────────────────────────────────────────────
  fan
    .command('set-lock <device> <on|off>')
    .description(t('fan.setLock.description'))
    .action(async (deviceId: string, val: string) => {
      const on = parseBool(val)
      if (on === undefined) {
        console.error(t('fan.setLock.invalid', { value: val }))
        process.exit(1)
      }
      const session = requireSession()
      const client = new FanClient({ deviceId, session, region: getRegion() })
      try {
        await client.connect()
        await client.setLocked(on)
        console.log(t('fan.setLock.success', { value: val }))
      } catch (e) {
        console.error(t('fan.error', { message: (e as Error).message }))
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  // ── watch ────────────────────────────────────────────────────────────────────
  fan
    .command('watch <device>')
    .description(t('fan.watch.description'))
    .option('--interval <ms>', t('fan.watch.option.interval'), '10000')
    .action(async (deviceId: string, opts: { interval: string }) => {
      const session = requireSession()
      const pollInterval = parseInt(opts.interval, 10) || 10_000
      const client = new FanClient({ deviceId, session, region: getRegion(), pollInterval })

      client.on('statusChange', (s: FanStatus) => {
        const ts = new Date().toISOString().slice(11, 19)
        console.log(t('fan.watch.status', {
          time: ts,
          on: String(s.on),
          speed: formatSpeed(s.speed),
          mode: s.mode,
          oscillating: String(s.oscillating),
        }))
      })
      client.on('modeChange', (mode: string) => console.log(t('fan.watch.modeChange', { mode })))
      client.on('speedChange', (speed: FanSpeed) => console.log(t('fan.watch.speedChange', { speed: formatSpeed(speed) })))
      client.on('oscillationChange', (oscillating: boolean) => console.log(t('fan.watch.oscillationChange', { oscillating: String(oscillating) })))
      client.on('error', (e: Error) => console.error(t('fan.error', { message: e.message })))

      await client.connect()
      console.log(t('fan.watch.intro', { deviceId, interval: pollInterval }))

      process.on('SIGINT', async () => {
        await client.disconnect()
        process.exit(0)
      })
    })

  program.addCommand(fan)
}
