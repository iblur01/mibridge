import { EventEmitter } from 'node:events'
import { MiConnector } from './connector/MiConnector.js'
import { createDevice } from './registry.js'
import { BaseFan } from './devices/BaseFan.js'
import type { FanStatus, FanMode, FanSpeed, Session, DeviceInfo } from './types.js'

interface FanClientConfig {
  deviceId: string
  region?: string
  pollInterval?: number
  session?: Session
}

export class FanClient extends EventEmitter {
  private deviceId: string
  private region: string
  private pollInterval: number
  private session: Session | undefined
  private connector: MiConnector
  private device: BaseFan | null = null
  private _connected = false
  private _pollTimer: ReturnType<typeof setInterval> | null = null
  private _lastStatus: FanStatus | null = null

  constructor(config: FanClientConfig) {
    super()
    this.deviceId = config.deviceId
    this.region = config.region ?? 'de'
    this.pollInterval = config.pollInterval ?? 10_000
    this.session = config.session
    this.connector = new MiConnector(this.region)
  }

  async connect(): Promise<void> {
    if (!this.session) throw new Error('No session provided')
    this.connector.injectSession(this.session)
    const devices = await this.connector.getDevices()
    const deviceInfo = devices.find((d: DeviceInfo) => String(d.did) === String(this.deviceId))
    if (!deviceInfo) throw new Error(`Device ${this.deviceId} not found`)
    this.device = createDevice(this.connector, deviceInfo) as BaseFan
    this._connected = true
    this.emit('connected')
    this._startPolling()
  }

  async disconnect(): Promise<void> {
    this._stopPolling()
    this._connected = false
    this.device = null
    this.emit('disconnected')
  }

  isConnected(): boolean { return this._connected }

  async getStatus(): Promise<FanStatus>            { return this._device().getStatus() }
  async setOn(on: boolean): Promise<void>           { await this._device().setOn(on) }
  async setSpeed(speed: FanSpeed): Promise<void>    { await this._device().setSpeed(speed) }
  async setMode(mode: FanMode): Promise<void>       { await this._device().setMode(mode) }
  async setOscillating(on: boolean): Promise<void>  { await this._device().setOscillating(on) }
  async setTimer(minutes: number): Promise<void>    { await this._device().setTimer(minutes) }
  async setBuzzer(on: boolean): Promise<void>       { await this._device().setBuzzer(on) }
  async setLed(on: boolean): Promise<void>          { await this._device().setLed(on) }
  async setLocked(on: boolean): Promise<void>       { await this._device().setLocked(on) }
  async toggle(): Promise<void>                     { await this._device().toggle() }

  private _startPolling(): void {
    this._pollTimer = setInterval(() => { void this._poll() }, this.pollInterval)
  }

  private _stopPolling(): void {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null }
  }

  private async _poll(): Promise<void> {
    if (!this._connected || !this.device) return
    try {
      const status = await this.device.getStatus()
      const prev = this._lastStatus

      if (!prev || prev.mode !== status.mode) this.emit('modeChange', status.mode)
      if (!prev || JSON.stringify(prev.speed) !== JSON.stringify(status.speed)) this.emit('speedChange', status.speed)
      if (!prev || prev.oscillating !== status.oscillating) this.emit('oscillationChange', status.oscillating)

      this._lastStatus = status
      this.emit('statusChange', status)
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)))
    }
  }

  private _device(): BaseFan {
    if (!this.device) throw new Error('Not connected. Call connect() first.')
    return this.device
  }
}
