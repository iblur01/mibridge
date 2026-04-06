import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { DreameVacuumClient } from '../src/client.js'
import { VacuumState, RunMode, CleanMode, WaterLevel, VacuumErrorCode } from '../src/types.js'
import type { Session, DeviceInfo } from '../src/types.js'

vi.mock('../src/devices/DreameVacuum.js', () => ({
  DreameVacuum: vi.fn().mockImplementation(() => ({
    getRawStatus: vi.fn().mockResolvedValue({
      state: VacuumState.Docked,
      runMode: RunMode.Idle,
      cleanMode: CleanMode.Vacuum,
      batteryLevel: 90,
      waterLevel: WaterLevel.Off,
      errorCode: VacuumErrorCode.None,
      taskStatus: 0,
    }),
    getInfo: vi.fn().mockResolvedValue({ model: 'dreame.vacuum.r2205', firmwareVersion: '4.2', serialNumber: 'SN1' }),
    doAction: vi.fn().mockResolvedValue(undefined),
    setProperty: vi.fn().mockResolvedValue(undefined),
    startCleanSegments: vi.fn().mockResolvedValue(undefined),
    startCleanZone: vi.fn().mockResolvedValue(undefined),
    getMapsAndRooms: vi.fn().mockResolvedValue([
      { id: '0', name: 'Map 1', areas: [{ id: '1', name: 'Living Room', mapId: '0' }] },
    ]),
  })),
}))

vi.mock('../src/connector/MiConnector.js', () => ({
  MiConnector: vi.fn().mockImplementation(() => ({
    injectSession: vi.fn(),
    getDevices: vi.fn().mockResolvedValue([
      { did: '42', model: 'dreame.vacuum.r2205', name: 'Dreame' } satisfies DeviceInfo,
    ]),
  })),
}))

const session: Session = { userId: '1', ssecurity: 'x', serviceToken: 'y', savedAt: '' }

describe('DreameVacuumClient', () => {
  let client: DreameVacuumClient

  beforeEach(async () => {
    vi.useFakeTimers()
    client = new DreameVacuumClient({ deviceId: '42', session, pollInterval: 1000 })
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
    vi.useRealTimers()
  })

  test('connect() sets isConnected() to true', async () => {
    expect(client.isConnected()).toBe(true)
  })

  test('disconnect() sets isConnected() to false and emits disconnected', async () => {
    const disconnectedFired = vi.fn()
    client.on('disconnected', disconnectedFired)
    await client.disconnect()
    expect(client.isConnected()).toBe(false)
    expect(disconnectedFired).toHaveBeenCalled()
  })

  test('getStatus() returns VacuumStatus', async () => {
    const status = await client.getStatus()
    expect(status.state).toBe(VacuumState.Docked)
    expect(status.batteryLevel).toBe(90)
    expect(status.runMode).toBe(RunMode.Idle)
  })

  test('getBatteryLevel() returns number', async () => {
    expect(await client.getBatteryLevel()).toBe(90)
  })

  test('getInfo() delegates to device', async () => {
    const info = await client.getInfo()
    expect(info.model).toBe('dreame.vacuum.r2205')
  })

  test('getMaps() returns maps from device', async () => {
    const maps = await client.getMaps()
    expect(maps).toHaveLength(1)
    expect(maps[0]!.areas[0]!.name).toBe('Living Room')
  })

  test('selectAreas() stores selection; getSelectedAreas() returns it', async () => {
    await client.selectAreas(['1', '2'])
    expect(await client.getSelectedAreas()).toEqual(['1', '2'])
  })

  test('startCleaningAreas() calls startCleanSegments on device', async () => {
    const { DreameVacuum } = await import('../src/devices/DreameVacuum.js')
    const mockDevice = vi.mocked(DreameVacuum).mock.results[0]!.value
    await client.startCleaningAreas(['1', '3'])
    expect(mockDevice.startCleanSegments).toHaveBeenCalledWith([1, 3], {})
  })

  test('polling emits stateChange when state changes', async () => {
    const { DreameVacuum } = await import('../src/devices/DreameVacuum.js')
    const mockDevice = vi.mocked(DreameVacuum).mock.results[0]!.value

    const stateChangeFired = vi.fn()
    client.on('stateChange', stateChangeFired)

    mockDevice.getRawStatus.mockResolvedValueOnce({
      state: VacuumState.Cleaning,
      runMode: RunMode.Cleaning,
      cleanMode: CleanMode.Vacuum,
      batteryLevel: 88,
      waterLevel: WaterLevel.Off,
      errorCode: VacuumErrorCode.None,
      taskStatus: 2,
    })

    await vi.advanceTimersByTimeAsync(1100)
    expect(stateChangeFired).toHaveBeenCalledWith(VacuumState.Cleaning)
  })

  test('polling emits operationComplete when state transitions to Docked', async () => {
    const { DreameVacuum } = await import('../src/devices/DreameVacuum.js')
    const mockDevice = vi.mocked(DreameVacuum).mock.results[0]!.value

    const completeFired = vi.fn()
    client.on('operationComplete', completeFired)

    mockDevice.getRawStatus.mockResolvedValueOnce({
      state: VacuumState.Cleaning,
      runMode: RunMode.Cleaning,
      cleanMode: CleanMode.Vacuum,
      batteryLevel: 88,
      waterLevel: WaterLevel.Off,
      errorCode: VacuumErrorCode.None,
      taskStatus: 2,
    })
    await vi.advanceTimersByTimeAsync(1100)

    mockDevice.getRawStatus.mockResolvedValueOnce({
      state: VacuumState.Docked,
      runMode: RunMode.Idle,
      cleanMode: CleanMode.Vacuum,
      batteryLevel: 90,
      waterLevel: WaterLevel.Off,
      errorCode: VacuumErrorCode.None,
      taskStatus: 0,
    })
    await vi.advanceTimersByTimeAsync(1100)

    expect(completeFired).toHaveBeenCalledOnce()
    const result = completeFired.mock.calls[0]![0]
    expect(result.completionErrorCode).toBe(VacuumErrorCode.None)
  })
})
