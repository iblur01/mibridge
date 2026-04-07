import { describe, test, expect, vi } from 'vitest'
import { PetFountain } from '../../src/devices/PetFountain.js'
import { FountainMode, FountainFaultCode } from '../../src/types.js'
import type { MiConnector } from '../../src/connector/MiConnector.js'
import type { DeviceInfo } from '../../src/types.js'

const deviceInfo: DeviceInfo = { did: '55', model: 'xiaomi.pet_waterer.iv02', name: 'Fontaine' }

function makeMiotResult(overrides: Record<number, unknown> = {}) {
  const defaults = [
    true,  // 0: on
    0,     // 1: fault (0 → None)
    0,     // 2: mode (0 → Sensor)
    false, // 3: water_shortage_status
    13,    // 4: filter_life_left (%)
    4,     // 5: filter_left_time (days)
    100,   // 6: battery_level (%)
  ]
  return defaults.map((v, i) => ({ value: overrides[i] ?? v }))
}

function makeConnector(results = makeMiotResult()): MiConnector {
  return {
    miotCall:   vi.fn().mockResolvedValue(results),
    miotAction: vi.fn().mockResolvedValue({ code: 0 }),
  } as unknown as MiConnector
}

describe('PetFountain', () => {
  describe('models', () => {
    test('includes xiaomi.pet_waterer.iv02', () => {
      expect(PetFountain.models).toContain('xiaomi.pet_waterer.iv02')
    })
    test('includes mmgg.pet_waterer.wi11', () => {
      expect(PetFountain.models).toContain('mmgg.pet_waterer.wi11')
    })
  })

  describe('getRawStatus()', () => {
    test('returns mapped status from default miot result', async () => {
      const fountain = new PetFountain(makeConnector(), deviceInfo)
      const status = await fountain.getRawStatus()
      expect(status.on).toBe(true)
      expect(status.fault).toBe(FountainFaultCode.None)
      expect(status.waterShortage).toBe(false)
      expect(status.mode).toBe(FountainMode.Sensor)
      expect(status.filterLifeLeft).toBe(13)
      expect(status.filterLeftTime).toBe(4)
      expect(status.batteryLevel).toBe(100)
    })

    test('maps fault code 1 to WaterShortage', async () => {
      const fountain = new PetFountain(makeConnector(makeMiotResult({ 1: 1 })), deviceInfo)
      const status = await fountain.getRawStatus()
      expect(status.fault).toBe(FountainFaultCode.WaterShortage)
    })

    test('maps fault code 2 to PumpBlocked', async () => {
      const fountain = new PetFountain(makeConnector(makeMiotResult({ 1: 2 })), deviceInfo)
      const status = await fountain.getRawStatus()
      expect(status.fault).toBe(FountainFaultCode.PumpBlocked)
    })

    test('maps fault code 3 to FilterExpired', async () => {
      const fountain = new PetFountain(makeConnector(makeMiotResult({ 1: 3 })), deviceInfo)
      const status = await fountain.getRawStatus()
      expect(status.fault).toBe(FountainFaultCode.FilterExpired)
    })

    test('maps fault code 4 to LidRemoved', async () => {
      const fountain = new PetFountain(makeConnector(makeMiotResult({ 1: 4 })), deviceInfo)
      const status = await fountain.getRawStatus()
      expect(status.fault).toBe(FountainFaultCode.LidRemoved)
    })

    test('maps water_shortage_status true', async () => {
      const fountain = new PetFountain(makeConnector(makeMiotResult({ 3: true })), deviceInfo)
      const status = await fountain.getRawStatus()
      expect(status.waterShortage).toBe(true)
    })

    test('maps mode 0 to Sensor', async () => {
      const fountain = new PetFountain(makeConnector(makeMiotResult({ 2: 0 })), deviceInfo)
      const status = await fountain.getRawStatus()
      expect(status.mode).toBe(FountainMode.Sensor)
    })

    test('maps mode 1 to Intermittent', async () => {
      const fountain = new PetFountain(makeConnector(makeMiotResult({ 2: 1 })), deviceInfo)
      const status = await fountain.getRawStatus()
      expect(status.mode).toBe(FountainMode.Intermittent)
    })

    test('maps mode 2 to Continuous', async () => {
      const fountain = new PetFountain(makeConnector(makeMiotResult({ 2: 2 })), deviceInfo)
      const status = await fountain.getRawStatus()
      expect(status.mode).toBe(FountainMode.Continuous)
    })

    test('passes correct siid/piid pairs to miotCall', async () => {
      const connector = makeConnector()
      const fountain = new PetFountain(connector, deviceInfo)
      await fountain.getRawStatus()
      expect(connector.miotCall).toHaveBeenCalledWith('55', 'get_properties', [
        { did: '55', siid: 2, piid: 1 },
        { did: '55', siid: 2, piid: 2 },
        { did: '55', siid: 2, piid: 4 },
        { did: '55', siid: 2, piid: 10 },
        { did: '55', siid: 3, piid: 1 },
        { did: '55', siid: 3, piid: 2 },
        { did: '55', siid: 5, piid: 1 },
      ])
    })
  })

  describe('doAction()', () => {
    test('calls miotAction with siid=4 aiid=1 for reset_filter_life', async () => {
      const connector = makeConnector()
      const fountain = new PetFountain(connector, deviceInfo)
      await fountain.doAction('reset_filter_life')
      expect(connector.miotAction).toHaveBeenCalledWith('55', 4, 1, [])
    })
  })

  describe('setProperty()', () => {
    test('calls miotCall set_properties with correct payload', async () => {
      const connector = makeConnector()
      const fountain = new PetFountain(connector, deviceInfo)
      await fountain.setProperty(2, 1, true)
      expect(connector.miotCall).toHaveBeenCalledWith('55', 'set_properties', [
        { did: '55', siid: 2, piid: 1, value: true },
      ])
    })

    test('throws when set_properties returns non-zero code', async () => {
      const connector = makeConnector()
      vi.mocked(connector.miotCall).mockResolvedValueOnce([{ code: -4002 }])
      const fountain = new PetFountain(connector, deviceInfo)
      await expect(fountain.setProperty(2, 4, 0)).rejects.toThrow('set_properties failed')
    })
  })
})
