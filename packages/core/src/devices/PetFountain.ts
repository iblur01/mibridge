import { BaseDevice } from './BaseDevice.js'
import { FountainMode, FountainFaultCode } from '../types.js'
import type { MiConnector } from '../connector/MiConnector.js'
import type { DeviceInfo, FountainStatus } from '../types.js'

const P = {
  on:               0,
  fault:            1,
  mode:             2,
  water_shortage:   3,
  filter_life_left: 4,
  filter_left_time: 5,
  battery_level:    6,
} as const

const MIOT_PROPS = [
  { siid: 2, piid: 1 },  // on
  { siid: 2, piid: 2 },  // fault
  { siid: 2, piid: 4 },  // mode
  { siid: 2, piid: 10 }, // water_shortage_status
  { siid: 3, piid: 1 },  // filter_life_left (%)
  { siid: 3, piid: 2 },  // filter_left_time (days)
  { siid: 5, piid: 1 },  // battery_level (%)
] as const

const ACTIONS = {
  reset_filter_life: { siid: 4, aiid: 1 },
} as const

type ActionName = keyof typeof ACTIONS

const FAULT_MAP: Record<number, FountainFaultCode> = {
  0: FountainFaultCode.None,
  1: FountainFaultCode.WaterShortage,
  2: FountainFaultCode.PumpBlocked,
  3: FountainFaultCode.FilterExpired,
  4: FountainFaultCode.LidRemoved,
}

const MODE_MAP: Record<number, FountainMode> = {
  0: FountainMode.Sensor,
  1: FountainMode.Intermittent,
  2: FountainMode.Continuous,
}

export class PetFountain extends BaseDevice {
  static readonly models = ['xiaomi.pet_waterer.iv02', 'mmgg.pet_waterer.wi11']

  constructor(connector: MiConnector, deviceInfo: DeviceInfo) {
    super(connector, deviceInfo)
  }

  async getRawStatus(): Promise<FountainStatus> {
    const did = String(this.deviceId)
    const params = MIOT_PROPS.map(p => ({ did, siid: p.siid, piid: p.piid }))
    const results = await this.connector.miotCall(did, 'get_properties', params) as Array<{ value: unknown }>
    const v = (idx: number) => results[idx]?.value

    return {
      on:             Boolean(v(P.on)),
      fault:          FAULT_MAP[(v(P.fault) as number) ?? 0] ?? FountainFaultCode.None,
      waterShortage:  Boolean(v(P.water_shortage)),
      mode:           MODE_MAP[(v(P.mode) as number) ?? 2] ?? FountainMode.Sensor,
      filterLifeLeft: (v(P.filter_life_left) as number) ?? 0,
      filterLeftTime: (v(P.filter_left_time) as number) ?? 0,
      batteryLevel:   (v(P.battery_level) as number) ?? 0,
    }
  }

  async doAction(name: ActionName): Promise<void> {
    const a = ACTIONS[name]
    await this.connector.miotAction(this.deviceId, a.siid, a.aiid, [])
  }

  async setProperty(siid: number, piid: number, value: unknown): Promise<void> {
    const did = String(this.deviceId)
    const resultRaw = await this.connector.miotCall(did, 'set_properties', [{ did, siid, piid, value }])
    const result = resultRaw as Array<{ code?: number }>
    const code = result[0]?.code
    if (code !== undefined && code !== 0) {
      throw new Error(`set_properties failed for siid=${siid} piid=${piid} code=${code}`)
    }
  }
}
