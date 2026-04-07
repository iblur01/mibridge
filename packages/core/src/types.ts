// ─── Operational state of the vacuum ─────────────────────────────────────────

export enum VacuumState {
  Idle = 'idle',
  Cleaning = 'cleaning',
  Mapping = 'mapping',
  Returning = 'returning',
  Docked = 'docked',
  Paused = 'paused',
  Error = 'error',
}

// ─── Error codes (aligned with Matter 1.4 ServiceArea cluster) ────────────────

export enum VacuumErrorCode {
  None = 'none',
  DustBinMissing = 'dustBinMissing',
  DustBinFull = 'dustBinFull',
  WaterTankEmpty = 'waterTankEmpty',
  WaterTankMissing = 'waterTankMissing',
  WaterTankLidOpen = 'waterTankLidOpen',
  MopPadMissing = 'mopPadMissing',
  BatteryLow = 'batteryLow',
  Stuck = 'stuck',
  BrushJammed = 'brushJammed',
  NavigationObscured = 'navigationObscured',
  Unknown = 'unknown',
}

// ─── Run mode (what the vacuum is doing at the mission level) ─────────────────

export enum RunMode {
  Idle = 'idle',
  Cleaning = 'cleaning',
  Mapping = 'mapping',
}

// ─── Clean mode (what the cleaning head is doing) ────────────────────────────

export enum CleanMode {
  Vacuum = 'vacuum',
  Mop = 'mop',
  VacuumThenMop = 'vacuumThenMop',
}

// ─── Water level for mopping ──────────────────────────────────────────────────

export enum WaterLevel {
  Off = 'off',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface VacuumStatus {
  state: VacuumState
  runMode: RunMode
  cleanMode: CleanMode
  batteryLevel: number
  waterLevel?: WaterLevel
  errorCode?: VacuumErrorCode
  currentAreaId?: string
}

export interface Area {
  id: string
  name: string
  mapId?: string
}

export interface VacuumMap {
  id: string
  name: string
  areas: Area[]
}

export interface AreaProgress {
  areaId: string
  status: 'pending' | 'operating' | 'skipped' | 'completed'
  operationalTime?: number
}

export interface OperationResult {
  completionErrorCode: VacuumErrorCode
  totalOperationalTime?: number
  pausedTime?: number
  areasProgress?: AreaProgress[]
}

export interface Session {
  userId: string
  ssecurity: string
  serviceToken: string
  savedAt: string
}

export interface DeviceInfo {
  did: string
  model: string
  name: string
}

// ─── Fountain distribution mode ───────────────────────────────────────────────

export enum FountainMode {
  Continuous   = 'continuous',
  Intermittent = 'intermittent',
  Sensor       = 'sensor',
}

// ─── Fountain fault codes (SIID 2, PIID 2) ───────────────────────────────────

export enum FountainFaultCode {
  None          = 'none',
  WaterShortage = 'waterShortage',
  PumpBlocked   = 'pumpBlocked',
  FilterExpired = 'filterExpired',
  LidRemoved    = 'lidRemoved',
}

// ─── Fountain status snapshot ────────────────────────────────────────────────

export interface FountainStatus {
  on: boolean
  mode: FountainMode
  fault: FountainFaultCode
  waterShortage: boolean
  filterLifeLeft: number   // % (0–100)
  filterLeftTime: number   // days remaining
  batteryLevel: number     // % (0–100)
}

// ─── Fan mode ────────────────────────────────────────────────────────────────

export enum FanMode {
  Straight = 'straight',  // 0 — vent direct
  Sleep    = 'sleep',     // 1 — mode nuit
}

// ─── Fan speed — union discriminée pour supporter niveaux discrets et % ──────

export type FanSpeed =
  | { type: 'level';   value: number }   // ex. 1|2|3 pour dmaker.fan.1c
  | { type: 'percent'; value: number }   // 0–100 pour futurs modèles

// ─── Fan status snapshot ─────────────────────────────────────────────────────

export interface FanStatus {
  on:            boolean
  speed:         FanSpeed
  mode:          FanMode
  oscillating:   boolean
  timerMinutes:  number    // 0 = pas de timer actif
  buzzer:        boolean
  led:           boolean
  locked:        boolean
}
