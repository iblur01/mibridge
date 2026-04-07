import { describe, test, expect, vi } from 'vitest'
import { DmakerFan1C } from '../../src/devices/DmakerFan1C.js'
import { FanMode } from '../../src/types.js'
import type { MiConnector } from '../../src/connector/MiConnector.js'
import type { DeviceInfo } from '../../src/types.js'

const deviceInfo: DeviceInfo = { did: '42', model: 'dmaker.fan.1c', name: 'Ventilateur' }

function makeMiotResult(overrides: Record<number, unknown> = {}) {
  const defaults = [
    true,   // 0: on
    2,      // 1: fan-level
    false,  // 2: horizontal-swing
    0,      // 3: mode (0 = straight)
    0,      // 4: off-delay-time
    false,  // 5: alarm/buzzer
    true,   // 6: brightness/led
    false,  // 7: physical-controls-locked
  ]
  return defaults.map((v, i) => ({ value: overrides[i] ?? v }))
}

function makeConnector(results = makeMiotResult()): MiConnector {
  return {
    miotCall:   vi.fn().mockResolvedValue(results),
    miotAction: vi.fn().mockResolvedValue(undefined),
  } as unknown as MiConnector
}

describe('DmakerFan1C', () => {
  describe('models', () => {
    test('includes dmaker.fan.1c', () => {
      expect(DmakerFan1C.models).toContain('dmaker.fan.1c')
    })
  })

  describe('getStatus()', () => {
    test('returns mapped status from default miot result', async () => {
      const fan = new DmakerFan1C(makeConnector(), deviceInfo)
      const status = await fan.getStatus()
      expect(status.on).toBe(true)
      expect(status.speed).toEqual({ type: 'level', value: 2 })
      expect(status.oscillating).toBe(false)
      expect(status.mode).toBe(FanMode.Straight)
      expect(status.timerMinutes).toBe(0)
      expect(status.buzzer).toBe(false)
      expect(status.led).toBe(true)
      expect(status.locked).toBe(false)
    })

    test('maps mode 1 to Sleep', async () => {
      const fan = new DmakerFan1C(makeConnector(makeMiotResult({ 3: 1 })), deviceInfo)
      const status = await fan.getStatus()
      expect(status.mode).toBe(FanMode.Sleep)
    })

    test('maps horizontal-swing true to oscillating true', async () => {
      const fan = new DmakerFan1C(makeConnector(makeMiotResult({ 2: true })), deviceInfo)
      const status = await fan.getStatus()
      expect(status.oscillating).toBe(true)
    })

    test('maps timerMinutes from off-delay-time', async () => {
      const fan = new DmakerFan1C(makeConnector(makeMiotResult({ 4: 60 })), deviceInfo)
      const status = await fan.getStatus()
      expect(status.timerMinutes).toBe(60)
    })

    test('passes correct siid/piid pairs to miotCall', async () => {
      const connector = makeConnector()
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.getStatus()
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'get_properties', [
        { did: '42', siid: 2, piid: 1 },
        { did: '42', siid: 2, piid: 2 },
        { did: '42', siid: 2, piid: 3 },
        { did: '42', siid: 2, piid: 7 },
        { did: '42', siid: 2, piid: 10 },
        { did: '42', siid: 2, piid: 11 },
        { did: '42', siid: 2, piid: 12 },
        { did: '42', siid: 3, piid: 1 },
      ])
    })
  })

  describe('setOn()', () => {
    test('calls set_properties siid=2 piid=1 with value', async () => {
      const connector = makeConnector([{ code: 0 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.setOn(false)
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'set_properties', [
        { did: '42', siid: 2, piid: 1, value: false },
      ])
    })

    test('throws when set_properties returns non-zero code', async () => {
      const connector = makeConnector([{ code: -4002 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await expect(fan.setOn(true)).rejects.toThrow('set_properties failed')
    })
  })

  describe('setSpeed()', () => {
    test('calls set_properties siid=2 piid=2 with level value', async () => {
      const connector = makeConnector([{ code: 0 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.setSpeed({ type: 'level', value: 3 })
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'set_properties', [
        { did: '42', siid: 2, piid: 2, value: 3 },
      ])
    })

    test('throws for type percent', async () => {
      const fan = new DmakerFan1C(makeConnector(), deviceInfo)
      await expect(fan.setSpeed({ type: 'percent', value: 50 })).rejects.toThrow(
        'dmaker.fan.1c only supports speed levels 1–3'
      )
    })

    test('throws for level 0', async () => {
      const fan = new DmakerFan1C(makeConnector(), deviceInfo)
      await expect(fan.setSpeed({ type: 'level', value: 0 })).rejects.toThrow(
        'dmaker.fan.1c only supports speed levels 1–3'
      )
    })

    test('throws for level 4', async () => {
      const fan = new DmakerFan1C(makeConnector(), deviceInfo)
      await expect(fan.setSpeed({ type: 'level', value: 4 })).rejects.toThrow(
        'dmaker.fan.1c only supports speed levels 1–3'
      )
    })
  })

  describe('setMode()', () => {
    test('calls set_properties siid=2 piid=7 with 1 for Sleep', async () => {
      const connector = makeConnector([{ code: 0 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.setMode(FanMode.Sleep)
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'set_properties', [
        { did: '42', siid: 2, piid: 7, value: 1 },
      ])
    })

    test('calls set_properties siid=2 piid=7 with 0 for Straight', async () => {
      const connector = makeConnector([{ code: 0 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.setMode(FanMode.Straight)
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'set_properties', [
        { did: '42', siid: 2, piid: 7, value: 0 },
      ])
    })
  })

  describe('setOscillating()', () => {
    test('calls set_properties siid=2 piid=3', async () => {
      const connector = makeConnector([{ code: 0 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.setOscillating(true)
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'set_properties', [
        { did: '42', siid: 2, piid: 3, value: true },
      ])
    })
  })

  describe('setTimer()', () => {
    test('calls set_properties siid=2 piid=10', async () => {
      const connector = makeConnector([{ code: 0 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.setTimer(120)
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'set_properties', [
        { did: '42', siid: 2, piid: 10, value: 120 },
      ])
    })
  })

  describe('setBuzzer()', () => {
    test('calls set_properties siid=2 piid=11', async () => {
      const connector = makeConnector([{ code: 0 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.setBuzzer(false)
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'set_properties', [
        { did: '42', siid: 2, piid: 11, value: false },
      ])
    })
  })

  describe('setLed()', () => {
    test('calls set_properties siid=2 piid=12', async () => {
      const connector = makeConnector([{ code: 0 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.setLed(false)
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'set_properties', [
        { did: '42', siid: 2, piid: 12, value: false },
      ])
    })
  })

  describe('setLocked()', () => {
    test('calls set_properties siid=3 piid=1', async () => {
      const connector = makeConnector([{ code: 0 }])
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.setLocked(true)
      expect(connector.miotCall).toHaveBeenCalledWith('42', 'set_properties', [
        { did: '42', siid: 3, piid: 1, value: true },
      ])
    })
  })

  describe('toggle()', () => {
    test('calls miotAction siid=2 aiid=1', async () => {
      const connector = makeConnector()
      const fan = new DmakerFan1C(connector, deviceInfo)
      await fan.toggle()
      expect(connector.miotAction).toHaveBeenCalledWith('42', 2, 1, [])
    })
  })
})
