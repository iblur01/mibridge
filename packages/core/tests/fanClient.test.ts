import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { FanClient } from '../src/fanClient.js'
import { FanMode } from '../src/types.js'
import type { FanStatus, FanSpeed, Session, DeviceInfo } from '../src/types.js'

const defaultStatus: FanStatus = {
  on: true,
  speed: { type: 'level', value: 2 },
  mode: FanMode.Straight,
  oscillating: false,
  timerMinutes: 0,
  buzzer: false,
  led: true,
  locked: false,
}

const mockDevice = {
  getStatus:      vi.fn().mockResolvedValue(defaultStatus),
  setOn:          vi.fn().mockResolvedValue(undefined),
  setSpeed:       vi.fn().mockResolvedValue(undefined),
  setMode:        vi.fn().mockResolvedValue(undefined),
  setOscillating: vi.fn().mockResolvedValue(undefined),
  setTimer:       vi.fn().mockResolvedValue(undefined),
  setBuzzer:      vi.fn().mockResolvedValue(undefined),
  setLed:         vi.fn().mockResolvedValue(undefined),
  setLocked:      vi.fn().mockResolvedValue(undefined),
  toggle:         vi.fn().mockResolvedValue(undefined),
}

vi.mock('../src/registry.js', () => ({
  createDevice: vi.fn().mockImplementation(() => mockDevice),
}))

vi.mock('../src/connector/MiConnector.js', () => ({
  MiConnector: vi.fn().mockImplementation(() => ({
    injectSession: vi.fn(),
    getDevices: vi.fn().mockResolvedValue([
      { did: '42', model: 'dmaker.fan.1c', name: 'Ventilateur' } satisfies DeviceInfo,
    ]),
  })),
}))

const session: Session = { userId: '1', ssecurity: 'x', serviceToken: 'y', savedAt: '' }

describe('FanClient', () => {
  let client: FanClient

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockDevice.getStatus.mockResolvedValue(defaultStatus)
    client = new FanClient({ deviceId: '42', session, pollInterval: 1000 })
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

  test('getStatus() returns FanStatus', async () => {
    const status = await client.getStatus()
    expect(status.on).toBe(true)
    expect(status.speed).toEqual({ type: 'level', value: 2 })
    expect(status.mode).toBe(FanMode.Straight)
  })

  test('setOn(false) delegates to device.setOn', async () => {
    await client.setOn(false)
    expect(mockDevice.setOn).toHaveBeenCalledWith(false)
  })

  test('setSpeed delegates to device.setSpeed', async () => {
    const speed: FanSpeed = { type: 'level', value: 3 }
    await client.setSpeed(speed)
    expect(mockDevice.setSpeed).toHaveBeenCalledWith(speed)
  })

  test('setMode(Sleep) delegates to device.setMode', async () => {
    await client.setMode(FanMode.Sleep)
    expect(mockDevice.setMode).toHaveBeenCalledWith(FanMode.Sleep)
  })

  test('setOscillating delegates to device.setOscillating', async () => {
    await client.setOscillating(true)
    expect(mockDevice.setOscillating).toHaveBeenCalledWith(true)
  })

  test('setTimer delegates to device.setTimer', async () => {
    await client.setTimer(60)
    expect(mockDevice.setTimer).toHaveBeenCalledWith(60)
  })

  test('setBuzzer delegates to device.setBuzzer', async () => {
    await client.setBuzzer(false)
    expect(mockDevice.setBuzzer).toHaveBeenCalledWith(false)
  })

  test('setLed delegates to device.setLed', async () => {
    await client.setLed(false)
    expect(mockDevice.setLed).toHaveBeenCalledWith(false)
  })

  test('setLocked delegates to device.setLocked', async () => {
    await client.setLocked(true)
    expect(mockDevice.setLocked).toHaveBeenCalledWith(true)
  })

  test('toggle delegates to device.toggle', async () => {
    await client.toggle()
    expect(mockDevice.toggle).toHaveBeenCalled()
  })

  test('polling emits statusChange every interval', async () => {
    const fired = vi.fn()
    client.on('statusChange', fired)
    await vi.advanceTimersByTimeAsync(1100)
    expect(fired).toHaveBeenCalledOnce()
  })

  test('polling emits modeChange when mode changes', async () => {
    const fired = vi.fn()
    client.on('modeChange', fired)
    mockDevice.getStatus.mockResolvedValueOnce({ ...defaultStatus, mode: FanMode.Sleep })
    await vi.advanceTimersByTimeAsync(1100)
    expect(fired).toHaveBeenCalledWith(FanMode.Sleep)
  })

  test('polling emits speedChange when speed changes', async () => {
    const fired = vi.fn()
    client.on('speedChange', fired)
    const newSpeed: FanSpeed = { type: 'level', value: 1 }
    mockDevice.getStatus.mockResolvedValueOnce({ ...defaultStatus, speed: newSpeed })
    await vi.advanceTimersByTimeAsync(1100)
    expect(fired).toHaveBeenCalledWith(newSpeed)
  })

  test('polling emits oscillationChange when oscillating changes', async () => {
    const fired = vi.fn()
    client.on('oscillationChange', fired)
    mockDevice.getStatus.mockResolvedValueOnce({ ...defaultStatus, oscillating: true })
    await vi.advanceTimersByTimeAsync(1100)
    expect(fired).toHaveBeenCalledWith(true)
  })

  test('polling emits error immediately on network failure', async () => {
    const fired = vi.fn()
    client.on('error', fired)
    mockDevice.getStatus.mockRejectedValueOnce(new Error('Network timeout'))
    await vi.advanceTimersByTimeAsync(1100)
    expect(fired).toHaveBeenCalledOnce()
    expect(client.isConnected()).toBe(true)
  })

  test('connect() throws if device not found', async () => {
    const { MiConnector } = await import('../src/connector/MiConnector.js')
    vi.mocked(MiConnector).mockImplementationOnce(() => ({
      injectSession: vi.fn(),
      getDevices: vi.fn().mockResolvedValue([]),
    }) as never)
    const badClient = new FanClient({ deviceId: '99', session })
    await expect(badClient.connect()).rejects.toThrow('Device 99 not found')
  })
})
