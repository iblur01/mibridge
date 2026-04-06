import { EventEmitter } from 'node:events'
import { MiConnector } from './connector/MiConnector.js'
import { DreameVacuum } from './devices/DreameVacuum.js'
import { VacuumState, VacuumErrorCode, CleanMode, WaterLevel } from './types.js'
import { VacuumError } from './errors.js'
import type {
  VacuumStatus, VacuumMap, Area, AreaProgress, OperationResult, Session, RunMode,
} from './types.js'

interface ClientConfig {
  deviceId: string
  region?: string
  pollInterval?: number
  session?: Session
}

export class DreameVacuumClient extends EventEmitter {
  private deviceId: string
  private region: string
  private pollInterval: number
  private session: Session | undefined
  private connector: MiConnector
  private device: DreameVacuum | null = null
  private _connected = false
  private _pollTimer: ReturnType<typeof setInterval> | null = null
  private _lastStatus: VacuumStatus | null = null
  private _selectedAreas: string[] = []
  private _completedAreas: Set<string> = new Set()
  private _operationActive = false
  private _operationStartTime: number | null = null
  private _pausedStartTime: number | null = null
  private _pausedDuration = 0
  private _lastOperationResult: OperationResult | null = null

  constructor(config: ClientConfig) {
    super()
    this.deviceId = config.deviceId
    this.region = config.region ?? 'de'
    this.pollInterval = config.pollInterval ?? 5000
    this.session = config.session
    this.connector = new MiConnector(this.region)
  }

  async connect(): Promise<void> {
    if (!this.session) throw new VacuumError(VacuumErrorCode.Unknown, 'No session provided')
    this.connector.injectSession(this.session)
    const devices = await this.connector.getDevices()
    const deviceInfo = devices.find(d => String(d.did) === String(this.deviceId))
    if (!deviceInfo) throw new VacuumError(VacuumErrorCode.Unknown, `Device ${this.deviceId} not found`)
    this.device = new DreameVacuum(this.connector, deviceInfo)
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

  async getInfo(): Promise<{ model: string; firmwareVersion: string; serialNumber: string }> {
    return this._device().getInfo()
  }

  async start(): Promise<void> { await this._device().doAction('start') }
  async pause(): Promise<void> { await this._device().doAction('pause') }
  async resume(): Promise<void> { await this._device().doAction('start') }
  async stop(): Promise<void> { await this._device().doAction('stop') }
  async returnToDock(): Promise<void> { await this._device().doAction('dock') }
  async startMapping(): Promise<void> { await this._device().doAction('map') }

  async getRunMode(): Promise<RunMode> {
    return (await this.getStatus()).runMode
  }

  async getCleanMode(): Promise<CleanMode> {
    return (await this.getStatus()).cleanMode
  }

  async setCleanMode(mode: CleanMode): Promise<void> {
    const codeMap: Record<CleanMode, number> = {
      [CleanMode.Vacuum]: 0, [CleanMode.Mop]: 1, [CleanMode.VacuumThenMop]: 2,
    }
    await this._device().setProperty(4, 23, codeMap[mode])
  }

  async getSupportedCleanModes(): Promise<CleanMode[]> {
    return [CleanMode.Vacuum, CleanMode.Mop, CleanMode.VacuumThenMop]
  }

  async getWaterLevel(): Promise<WaterLevel> {
    return (await this.getStatus()).waterLevel ?? WaterLevel.Off
  }

  async setWaterLevel(level: WaterLevel): Promise<void> {
    const codeMap: Record<WaterLevel, number> = {
      [WaterLevel.Off]: 0, [WaterLevel.Low]: 1, [WaterLevel.Medium]: 2, [WaterLevel.High]: 3,
    }
    await this._device().setProperty(4, 5, codeMap[level])
  }

  async getMaps(): Promise<VacuumMap[]> {
    return this._device().getMapsAndRooms()
  }

  async getAreas(mapId?: string): Promise<Area[]> {
    const maps = await this.getMaps()
    if (mapId) return maps.find(m => m.id === mapId)?.areas ?? []
    return maps[0]?.areas ?? []
  }

  async selectAreas(areaIds: string[]): Promise<void> {
    this._selectedAreas = [...areaIds]
  }

  async getSelectedAreas(): Promise<string[]> {
    return [...this._selectedAreas]
  }

  async getCurrentArea(): Promise<string | null> {
    return (await this.getStatus()).currentAreaId ?? null
  }

  async skipCurrentArea(): Promise<void> {
    throw new VacuumError(VacuumErrorCode.Unknown, 'skipCurrentArea not supported on this model')
  }

  async getAreasProgress(): Promise<AreaProgress[]> {
    const currentAreaId = await this.getCurrentArea()
    return this._selectedAreas.map(id => ({
      areaId: id,
      status: this._completedAreas.has(id)
        ? ('completed' as const)
        : id === currentAreaId
          ? ('operating' as const)
          : ('pending' as const),
    }))
  }

  async startCleaningAreas(
    areaIds: string[],
    opts: { repeat?: number; suction?: number; water?: number } = {},
  ): Promise<void> {
    this._selectedAreas = [...areaIds]
    this._completedAreas.clear()
    await this._device().startCleanSegments(areaIds.map(Number), opts)
  }

  async getStatus(): Promise<VacuumStatus> {
    const raw = await this._device().getRawStatus()
    return {
      state: raw.state, runMode: raw.runMode, cleanMode: raw.cleanMode,
      batteryLevel: raw.batteryLevel, waterLevel: raw.waterLevel, errorCode: raw.errorCode,
    }
  }

  async getBatteryLevel(): Promise<number> {
    return (await this.getStatus()).batteryLevel
  }

  async getLastOperationResult(): Promise<OperationResult | null> {
    return this._lastOperationResult
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
      const raw = await this.device.getRawStatus()
      const status: VacuumStatus = {
        state: raw.state, runMode: raw.runMode, cleanMode: raw.cleanMode,
        batteryLevel: raw.batteryLevel, waterLevel: raw.waterLevel, errorCode: raw.errorCode,
      }
      const prev = this._lastStatus

      if (!prev || prev.state !== status.state) {
        this.emit('stateChange', status.state)
        this._handleStateTransition(prev?.state ?? null, status.state, status)
      }
      if (!prev || prev.cleanMode !== status.cleanMode) this.emit('cleanModeChange', status.cleanMode)
      if (!prev || prev.currentAreaId !== status.currentAreaId) {
        this.emit('areaChange', status.currentAreaId ?? null)
      }
      if (status.errorCode && status.errorCode !== VacuumErrorCode.None) {
        if (!prev || prev.errorCode !== status.errorCode) {
          this.emit('error', new VacuumError(status.errorCode))
        }
      }
      if (this._selectedAreas.length > 0) {
        this.emit('progressUpdate', await this.getAreasProgress())
      }

      this._lastStatus = status
      this.emit('statusChange', status)
    } catch (err) {
      this.emit('error', err)
    }
  }

  private _handleStateTransition(
    prevState: VacuumState | null,
    nextState: VacuumState,
    status: VacuumStatus,
  ): void {
    const wasActive = prevState === VacuumState.Cleaning || prevState === VacuumState.Returning
    const isDone = nextState === VacuumState.Docked || nextState === VacuumState.Idle

    if (nextState === VacuumState.Cleaning && !this._operationActive) {
      this._operationActive = true
      this._operationStartTime = Date.now()
      this._pausedDuration = 0
    }
    if (nextState === VacuumState.Paused && this._pausedStartTime === null) {
      this._pausedStartTime = Date.now()
    }
    if (prevState === VacuumState.Paused && nextState === VacuumState.Cleaning && this._pausedStartTime) {
      this._pausedDuration += Date.now() - this._pausedStartTime
      this._pausedStartTime = null
    }
    if (wasActive && isDone && this._operationActive) {
      this._operationActive = false
      const totalMs = this._operationStartTime ? Date.now() - this._operationStartTime : undefined
      const result: OperationResult = {
        completionErrorCode: status.errorCode ?? VacuumErrorCode.None,
        totalOperationalTime: totalMs ? Math.round(totalMs / 1000) : undefined,
        pausedTime: this._pausedDuration ? Math.round(this._pausedDuration / 1000) : undefined,
        areasProgress: this._selectedAreas.length > 0
          ? this._selectedAreas.map(id => ({
              areaId: id,
              status: (this._completedAreas.has(id) ? 'completed' : 'skipped') as 'completed' | 'skipped',
            }))
          : undefined,
      }
      this._lastOperationResult = result
      this._operationStartTime = null
      this._pausedDuration = 0
      this._pausedStartTime = null
      this.emit('operationComplete', result)
    }
  }

  private _device(): DreameVacuum {
    if (!this.device) throw new VacuumError(VacuumErrorCode.Unknown, 'Not connected. Call connect() first.')
    return this.device
  }
}
