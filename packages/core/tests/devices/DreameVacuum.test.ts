// packages/xiaomi-vacuum-core/tests/devices/DreameVacuum.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { DreameVacuum } from '../../src/devices/DreameVacuum.js'
import { VacuumState, RunMode, CleanMode, WaterLevel, VacuumErrorCode } from '../../src/types.js'
import type { MiConnector } from '../../src/connector/MiConnector.js'
import type { DeviceInfo } from '../../src/types.js'

const deviceInfo: DeviceInfo = { did: '99', model: 'dreame.vacuum.r2205', name: 'Test' }

function makeMiotResult(overrides: Record<number, unknown> = {}) {
  const defaults = [
    6,    // 0: state (6=Charging → Docked)
    0,    // 1: error_code
    85,   // 2: battery
    1,    // 3: charging_status
    6,    // 4: status (6=Charging → Idle RunMode)
    0,    // 5: cleaning_time_m
    0,    // 6: cleaned_area_m2
    2,    // 7: suction_level
    2,    // 8: water_volume
    1,    // 9: water_tank
    0,    // 10: task_status
    0,    // 11: cleaning_mode (0=Vacuum)
    0,    // 12: self_wash_status
    80,   // 13: main_brush_pct
    70,   // 14: side_brush_pct
    90,   // 15: filter_pct
    120,  // 16: total_time_h
    42,   // 17: total_cleanings
    500,  // 18: total_area_m2
    1,    // 19: auto_empty_enabled
    0,    // 20: auto_empty_status
    60,   // 21: mop_pad_pct
    '4.2.0',    // 22: fw_version
    'SN-12345', // 23: serial_number
  ]
  return defaults.map((v, i) => ({ value: overrides[i] ?? v }))
}

function makeConnector(miotResults: object[] = makeMiotResult()): MiConnector {
  return {
    miotCall: vi.fn().mockResolvedValue(miotResults),
    miotAction: vi.fn().mockResolvedValue({ code: 0 }),
    getFileUrl: vi.fn().mockResolvedValue(null),
  } as unknown as MiConnector
}

describe('DreameVacuum', () => {
  describe('getRawStatus()', () => {
    test('maps charging state to Docked', async () => {
      const vacuum = new DreameVacuum(makeConnector(), deviceInfo)
      const status = await vacuum.getRawStatus()
      expect(status.state).toBe(VacuumState.Docked)
      expect(status.batteryLevel).toBe(85)
    })

    test('maps sweeping state (1) to Cleaning', async () => {
      const vacuum = new DreameVacuum(makeConnector(makeMiotResult({ 0: 1, 4: 2 })), deviceInfo)
      const status = await vacuum.getRawStatus()
      expect(status.state).toBe(VacuumState.Cleaning)
      expect(status.runMode).toBe(RunMode.Cleaning)
    })

    test('maps mapping state (11) to Mapping', async () => {
      const vacuum = new DreameVacuum(makeConnector(makeMiotResult({ 0: 11, 4: 21 })), deviceInfo)
      const status = await vacuum.getRawStatus()
      expect(status.state).toBe(VacuumState.Mapping)
      expect(status.runMode).toBe(RunMode.Mapping)
    })

    test('maps paused state (3) to Paused', async () => {
      const vacuum = new DreameVacuum(makeConnector(makeMiotResult({ 0: 3 })), deviceInfo)
      const status = await vacuum.getRawStatus()
      expect(status.state).toBe(VacuumState.Paused)
    })

    test('maps error state (4) with error code 8 to DustBinMissing', async () => {
      const vacuum = new DreameVacuum(makeConnector(makeMiotResult({ 0: 4, 1: 8 })), deviceInfo)
      const status = await vacuum.getRawStatus()
      expect(status.state).toBe(VacuumState.Error)
      expect(status.errorCode).toBe(VacuumErrorCode.DustBinMissing)
    })

    test('maps cleaning_mode 1 to Mop', async () => {
      const vacuum = new DreameVacuum(makeConnector(makeMiotResult({ 11: 1 })), deviceInfo)
      const status = await vacuum.getRawStatus()
      expect(status.cleanMode).toBe(CleanMode.Mop)
    })

    test('maps water_volume 3 to High', async () => {
      const vacuum = new DreameVacuum(makeConnector(makeMiotResult({ 8: 3 })), deviceInfo)
      const status = await vacuum.getRawStatus()
      expect(status.waterLevel).toBe(WaterLevel.High)
    })
  })

  describe('getInfo()', () => {
    test('returns model, firmwareVersion, serialNumber', async () => {
      const vacuum = new DreameVacuum(makeConnector(), deviceInfo)
      const info = await vacuum.getInfo()
      expect(info.model).toBe('dreame.vacuum.r2205')
      expect(info.firmwareVersion).toBe('4.2.0')
      expect(info.serialNumber).toBe('SN-12345')
    })
  })

  describe('doAction()', () => {
    test('triggers start action with correct siid/aiid', async () => {
      const connector = makeConnector()
      const vacuum = new DreameVacuum(connector, deviceInfo)
      await vacuum.doAction('start')
      expect(connector.miotAction).toHaveBeenCalledWith('99', 2, 1, [])
    })
  })
})
