import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { PetFountainClient } from '../src/fountainClient.js'
import { FountainMode, FountainFaultCode } from '../src/types.js'
import type { FountainStatus, Session, DeviceInfo } from '../src/types.js'

vi.mock('../src/devices/PetFountain.js', () => ({
  PetFountain: vi.fn().mockImplementation(() => ({
    getRawStatus: vi.fn().mockResolvedValue({
      on: true,
      fault: FountainFaultCode.None,
      waterShortage: false,
      mode: FountainMode.Sensor,
      filterLifeLeft: 80,
      filterLeftTime: 30,
      batteryLevel: 65,
    } satisfies FountainStatus),
    doAction: vi.fn().mockResolvedValue(undefined),
    setProperty: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('../src/connector/MiConnector.js', () => ({
  MiConnector: vi.fn().mockImplementation(() => ({
    injectSession: vi.fn(),
    getDevices: vi.fn().mockResolvedValue([
      { did: '55', model: 'xiaomi.pet_waterer.iv02', name: 'Fontaine' } satisfies DeviceInfo,
    ]),
  })),
}))

const session: Session = { userId: '1', ssecurity: 'x', serviceToken: 'y', savedAt: '' }

describe('PetFountainClient', () => {
  let client: PetFountainClient

  beforeEach(async () => {
    vi.useFakeTimers()
    client = new PetFountainClient({ deviceId: '55', session, pollInterval: 1000 })
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
    vi.useRealTimers()
  })

  test('connect() sets isConnected() to true', () => {
    expect(client.isConnected()).toBe(true)
  })

  test('disconnect() sets isConnected() to false and emits disconnected', async () => {
    const fired = vi.fn()
    client.on('disconnected', fired)
    await client.disconnect()
    expect(client.isConnected()).toBe(false)
    expect(fired).toHaveBeenCalled()
  })

  test('getStatus() returns FountainStatus', async () => {
    const status = await client.getStatus()
    expect(status.on).toBe(true)
    expect(status.batteryLevel).toBe(65)
    expect(status.mode).toBe(FountainMode.Sensor)
    expect(status.fault).toBe(FountainFaultCode.None)
  })

  test('setOn(false) calls setProperty(2, 1, false)', async () => {
    const { PetFountain } = await import('../src/devices/PetFountain.js')
    const mockDevice = vi.mocked(PetFountain).mock.results[0]!.value
    await client.setOn(false)
    expect(mockDevice.setProperty).toHaveBeenCalledWith(2, 1, false)
  })

  test('setMode(Continuous) calls setProperty(2, 4, 2)', async () => {
    const { PetFountain } = await import('../src/devices/PetFountain.js')
    const mockDevice = vi.mocked(PetFountain).mock.results[0]!.value
    await client.setMode(FountainMode.Continuous)
    expect(mockDevice.setProperty).toHaveBeenCalledWith(2, 4, 2)
  })

  test('setMode(Intermittent) calls setProperty(2, 4, 1)', async () => {
    const { PetFountain } = await import('../src/devices/PetFountain.js')
    const mockDevice = vi.mocked(PetFountain).mock.results[0]!.value
    await client.setMode(FountainMode.Intermittent)
    expect(mockDevice.setProperty).toHaveBeenCalledWith(2, 4, 1)
  })

  test('setMode(Sensor) calls setProperty(2, 4, 0)', async () => {
    const { PetFountain } = await import('../src/devices/PetFountain.js')
    const mockDevice = vi.mocked(PetFountain).mock.results[0]!.value
    await client.setMode(FountainMode.Sensor)
    expect(mockDevice.setProperty).toHaveBeenCalledWith(2, 4, 0)
  })

  test('resetFilter() calls doAction(reset_filter_life)', async () => {
    const { PetFountain } = await import('../src/devices/PetFountain.js')
    const mockDevice = vi.mocked(PetFountain).mock.results[0]!.value
    await client.resetFilter()
    expect(mockDevice.doAction).toHaveBeenCalledWith('reset_filter_life')
  })

  test('polling emits statusChange every interval', async () => {
    const fired = vi.fn()
    client.on('statusChange', fired)
    await vi.advanceTimersByTimeAsync(1100)
    expect(fired).toHaveBeenCalledOnce()
  })

  test('polling emits faultChange when fault changes', async () => {
    const { PetFountain } = await import('../src/devices/PetFountain.js')
    const mockDevice = vi.mocked(PetFountain).mock.results[0]!.value
    const fired = vi.fn()
    client.on('faultChange', fired)

    mockDevice.getRawStatus.mockResolvedValueOnce({
      on: true,
      fault: FountainFaultCode.WaterShortage,
      waterShortage: true,
      mode: FountainMode.Sensor,
      filterLifeLeft: 80,
      filterLeftTime: 30,
      batteryLevel: 65,
    })
    await vi.advanceTimersByTimeAsync(1100)
    expect(fired).toHaveBeenCalledWith(FountainFaultCode.WaterShortage)
  })

  test('polling emits waterShortage(true) when shortage appears', async () => {
    const { PetFountain } = await import('../src/devices/PetFountain.js')
    const mockDevice = vi.mocked(PetFountain).mock.results[0]!.value
    const fired = vi.fn()
    client.on('waterShortage', fired)

    mockDevice.getRawStatus.mockResolvedValueOnce({
      on: false,
      fault: FountainFaultCode.WaterShortage,
      waterShortage: true,
      mode: FountainMode.Sensor,
      filterLifeLeft: 80,
      filterLeftTime: 30,
      batteryLevel: 60,
    })
    await vi.advanceTimersByTimeAsync(1100)
    expect(fired).toHaveBeenCalledWith(true)
  })

  test('polling emits error after 3 consecutive failures, then continues polling', async () => {
    const { PetFountain } = await import('../src/devices/PetFountain.js')
    const mockDevice = vi.mocked(PetFountain).mock.results[0]!.value
    const errorFired = vi.fn()
    client.on('error', errorFired)

    const networkError = new Error('Network timeout')
    mockDevice.getRawStatus
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)

    await vi.advanceTimersByTimeAsync(3300)
    expect(errorFired).toHaveBeenCalledOnce()
    expect(client.isConnected()).toBe(true)
  })

  test('connect() throws if device not found', async () => {
    const { MiConnector } = await import('../src/connector/MiConnector.js')
    vi.mocked(MiConnector).mockImplementationOnce(() => ({
      injectSession: vi.fn(),
      getDevices: vi.fn().mockResolvedValue([]),
    }) as never)
    const badClient = new PetFountainClient({ deviceId: '99', session })
    await expect(badClient.connect()).rejects.toThrow('Device 99 not found')
  })
})
