import { BaseFan } from './BaseFan.js'
import { FanMode } from '../types.js'
import type { MiConnector } from '../connector/MiConnector.js'
import type { DeviceInfo, FanSpeed, FanStatus } from '../types.js'

const P = {
  on:      0,
  level:   1,
  swing:   2,
  mode:    3,
  timer:   4,
  buzzer:  5,
  led:     6,
  locked:  7,
} as const

const MIOT_PROPS = [
  { siid: 2, piid: 1 },   // on
  { siid: 2, piid: 2 },   // fan-level
  { siid: 2, piid: 3 },   // horizontal-swing
  { siid: 2, piid: 7 },   // mode
  { siid: 2, piid: 10 },  // off-delay-time
  { siid: 2, piid: 11 },  // alarm/buzzer
  { siid: 2, piid: 12 },  // brightness/led
  { siid: 3, piid: 1 },   // physical-controls-locked
] as const

const MODE_MAP: Record<number, FanMode> = {
  0: FanMode.Straight,
  1: FanMode.Sleep,
}

const MODE_TO_CODE: Record<FanMode, number> = {
  [FanMode.Straight]: 0,
  [FanMode.Sleep]:    1,
}

export class DmakerFan1C extends BaseFan {
  static readonly models = ['dmaker.fan.1c']

  constructor(connector: MiConnector, deviceInfo: DeviceInfo) {
    super(connector, deviceInfo)
  }

  async getStatus(): Promise<FanStatus> {
    const did = String(this.deviceId)
    const params = MIOT_PROPS.map(p => ({ did, siid: p.siid, piid: p.piid }))
    const results = await this.connector.miotCall(did, 'get_properties', params) as Array<{ value: unknown }>
    const v = (idx: number) => results[idx]?.value

    return {
      on:           Boolean(v(P.on)),
      speed:        { type: 'level', value: (v(P.level) as number) ?? 1 },
      oscillating:  Boolean(v(P.swing)),
      mode:         MODE_MAP[Number(v(P.mode))] ?? FanMode.Straight,
      timerMinutes: (v(P.timer) as number) ?? 0,
      buzzer:       Boolean(v(P.buzzer)),
      led:          Boolean(v(P.led)),
      locked:       Boolean(v(P.locked)),
    }
  }

  private async _set(siid: number, piid: number, value: unknown): Promise<void> {
    const did = String(this.deviceId)
    const resultRaw = await this.connector.miotCall(did, 'set_properties', [{ did, siid, piid, value }])
    const result = resultRaw as Array<{ code?: number }>
    const code = result[0]?.code
    if (code !== undefined && code !== 0) {
      throw new Error(`set_properties failed for siid=${siid} piid=${piid} code=${code}`)
    }
  }

  async setOn(on: boolean): Promise<void> { await this._set(2, 1, on) }

  async setSpeed(speed: FanSpeed): Promise<void> {
    if (speed.type !== 'level' || speed.value < 1 || speed.value > 3) {
      throw new Error('dmaker.fan.1c only supports speed levels 1\u20133')
    }
    await this._set(2, 2, speed.value)
  }

  async setMode(mode: FanMode): Promise<void>      { await this._set(2, 7, MODE_TO_CODE[mode]) }
  async setOscillating(on: boolean): Promise<void>  { await this._set(2, 3, on) }
  async setTimer(minutes: number): Promise<void>    { await this._set(2, 10, minutes) }
  async setBuzzer(on: boolean): Promise<void>       { await this._set(2, 11, on) }
  async setLed(on: boolean): Promise<void>          { await this._set(2, 12, on) }
  async setLocked(on: boolean): Promise<void>       { await this._set(3, 1, on) }

  async toggle(): Promise<void> {
    await this.connector.miotAction(this.deviceId, 2, 1, [])
  }
}
