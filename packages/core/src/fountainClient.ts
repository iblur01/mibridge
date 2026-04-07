import { EventEmitter } from 'node:events'
import { MiConnector } from './connector/MiConnector.js'
import { PetFountain } from './devices/PetFountain.js'
import { FountainMode } from './types.js'
import type { FountainStatus, Session, DeviceInfo } from './types.js'

interface FountainClientConfig {
  deviceId: string
  region?: string
  pollInterval?: number
  session?: Session
}

const MODE_TO_CODE: Record<FountainMode, number> = {
  [FountainMode.Continuous]:   2,
  [FountainMode.Intermittent]: 1,
  [FountainMode.Sensor]:       0,
}

export class PetFountainClient extends EventEmitter {
  private deviceId: string
  private region: string
  private pollInterval: number
  private session: Session | undefined
  private connector: MiConnector
  private device: PetFountain | null = null
  private _connected = false
  private _pollTimer: ReturnType<typeof setInterval> | null = null
  private _lastStatus: FountainStatus | null = null
  private _consecutiveErrors = 0

  constructor(config: FountainClientConfig) {
    super()
    this.deviceId = config.deviceId
    this.region = config.region ?? 'de'
    this.pollInterval = config.pollInterval ?? 30_000
    this.session = config.session
    this.connector = new MiConnector(this.region)
  }

  async connect(): Promise<void> {
    if (!this.session) throw new Error('No session provided')
    this.connector.injectSession(this.session)
    const devices = await this.connector.getDevices()
    const deviceInfo = devices.find((d: DeviceInfo) => String(d.did) === String(this.deviceId))
    if (!deviceInfo) throw new Error(`Device ${this.deviceId} not found`)
    this.device = new PetFountain(this.connector, deviceInfo)
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

  async getStatus(): Promise<FountainStatus> {
    return this._device().getRawStatus()
  }

  async setOn(on: boolean): Promise<void> {
    await this._device().setProperty(2, 1, on)
  }

  async setMode(mode: FountainMode): Promise<void> {
    await this._device().setProperty(2, 4, MODE_TO_CODE[mode])
  }

  async resetFilter(): Promise<void> {
    await this._device().doAction('reset_filter_life')
  }

  private _startPolling(): void {
    this._pollTimer = setInterval(() => { void this._poll() }, this.pollInterval)
  }

  private _stopPolling(): void {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null }
  }

  private async _poll(): Promise<void> {
    if (!this._connected || !this.device) return
    try {
      const status = await this.device.getRawStatus()
      this._consecutiveErrors = 0
      const prev = this._lastStatus

      if (!prev || prev.fault !== status.fault) this.emit('faultChange', status.fault)
      if (!prev || prev.mode !== status.mode) this.emit('modeChange', status.mode)
      if (!prev || prev.waterShortage !== status.waterShortage) this.emit('waterShortage', status.waterShortage)

      this._lastStatus = status
      this.emit('statusChange', status)
    } catch (err) {
      // The fountain aggressively sleeps its Wi-Fi to preserve battery, so transient
      // timeouts are expected. Emit 'error' only after 3 consecutive failures to avoid
      // false alarms, then reset the counter so the next streak is treated the same way.
      this._consecutiveErrors++
      if (this._consecutiveErrors === 3) {
        this.emit('error', err instanceof Error ? err : new Error(String(err)))
        this._consecutiveErrors = 0
      }
    }
  }

  private _device(): PetFountain {
    if (!this.device) throw new Error('Not connected. Call connect() first.')
    return this.device
  }
}
