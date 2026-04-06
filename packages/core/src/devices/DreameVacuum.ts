import { get as httpGet } from 'node:http'
import { get as httpsGet } from 'node:https'
import { inflateSync } from 'node:zlib'
import { BaseDevice } from './BaseDevice.js'
import { VacuumState, RunMode, CleanMode, WaterLevel, VacuumErrorCode } from '../types.js'
import type { MiConnector } from '../connector/MiConnector.js'
import type { DeviceInfo, VacuumMap, Area } from '../types.js'

const P = {
  state: 0, error_code: 1, battery: 2, charging_status: 3,
  status: 4, cleaning_time_m: 5, cleaned_area_m2: 6, suction_level: 7,
  water_volume: 8, water_tank: 9, task_status: 10, cleaning_mode: 11,
  self_wash_status: 12, main_brush_pct: 13, side_brush_pct: 14, filter_pct: 15,
  total_time_h: 16, total_cleanings: 17, total_area_m2: 18, auto_empty_enabled: 19,
  auto_empty_status: 20, mop_pad_pct: 21, fw_version: 22, serial_number: 23,
}

const MIOT_PROPS = [
  { siid: 2,  piid: 1  }, { siid: 2,  piid: 2  }, { siid: 3,  piid: 1  },
  { siid: 3,  piid: 2  }, { siid: 4,  piid: 1  }, { siid: 4,  piid: 2  },
  { siid: 4,  piid: 3  }, { siid: 4,  piid: 4  }, { siid: 4,  piid: 5  },
  { siid: 4,  piid: 6  }, { siid: 4,  piid: 7  }, { siid: 4,  piid: 23 },
  { siid: 4,  piid: 25 }, { siid: 9,  piid: 2  }, { siid: 10, piid: 2  },
  { siid: 11, piid: 1  }, { siid: 12, piid: 2  }, { siid: 12, piid: 3  },
  { siid: 12, piid: 4  }, { siid: 15, piid: 1  }, { siid: 15, piid: 5  },
  { siid: 18, piid: 1  }, { siid: 1,  piid: 3  }, { siid: 1,  piid: 5  },
]

const ACTIONS = {
  start:  { siid: 2,  aiid: 1 },
  pause:  { siid: 2,  aiid: 2 },
  dock:   { siid: 3,  aiid: 1 },
  stop:   { siid: 4,  aiid: 2 },
  locate: { siid: 7,  aiid: 1 },
  empty:  { siid: 15, aiid: 1 },
  map:    { siid: 4,  aiid: 1, mapMode: true as const },
} as const

type ActionName = keyof typeof ACTIONS

function mapState(code: number): VacuumState {
  if ([1, 7, 12].includes(code)) return VacuumState.Cleaning
  if ([5, 10].includes(code)) return VacuumState.Returning
  if (code === 3) return VacuumState.Paused
  if (code === 4) return VacuumState.Error
  if ([6, 13].includes(code)) return VacuumState.Docked
  if (code === 11) return VacuumState.Mapping
  return VacuumState.Idle
}

function mapRunMode(statusCode: number): RunMode {
  if ([2, 4, 5, 18, 19, 20, 22].includes(statusCode)) return RunMode.Cleaning
  if (statusCode === 21) return RunMode.Mapping
  return RunMode.Idle
}

function mapCleanMode(code: number): CleanMode {
  if (code === 1) return CleanMode.Mop
  if (code === 2) return CleanMode.VacuumThenMop
  return CleanMode.Vacuum
}

function mapWaterLevel(code: number | undefined): WaterLevel {
  if (code === 1) return WaterLevel.Low
  if (code === 2) return WaterLevel.Medium
  if (code === 3) return WaterLevel.High
  return WaterLevel.Off
}

function mapErrorCode(code: number): VacuumErrorCode {
  if (code === 0) return VacuumErrorCode.None
  if (code === 8) return VacuumErrorCode.DustBinMissing
  if (code === 101) return VacuumErrorCode.DustBinFull
  if ([10, 107].includes(code)) return VacuumErrorCode.WaterTankEmpty
  if ([9, 105].includes(code)) return VacuumErrorCode.WaterTankMissing
  if (code === 102) return VacuumErrorCode.WaterTankLidOpen
  if (code === 69) return VacuumErrorCode.MopPadMissing
  if (code === 20) return VacuumErrorCode.BatteryLow
  if ([17, 18].includes(code)) return VacuumErrorCode.Stuck
  if ([12, 13].includes(code)) return VacuumErrorCode.BrushJammed
  if ([48, 19].includes(code)) return VacuumErrorCode.NavigationObscured
  return VacuumErrorCode.Unknown
}

export interface DreameRawStatus {
  state: VacuumState
  runMode: RunMode
  cleanMode: CleanMode
  batteryLevel: number
  waterLevel: WaterLevel
  errorCode: VacuumErrorCode
  taskStatus: number
}

export class DreameVacuum extends BaseDevice {
  static readonly models = [
    'dreame.vacuum.r2205', 'dreame.vacuum.p2028', 'dreame.vacuum.p2029',
    'dreame.vacuum.p2114', 'dreame.vacuum.p2150a', 'dreame.vacuum.p2150b',
  ]

  async getRawStatus(): Promise<DreameRawStatus> {
    const did = String(this.deviceId)
    const params = MIOT_PROPS.map(p => ({ did, siid: p.siid, piid: p.piid }))
    const results = await this.connector.miotCall(did, 'get_properties', params) as Array<{ value: unknown }>
    const v = (idx: number) => results[idx]?.value

    return {
      state:        mapState(v(P.state) as number),
      runMode:      mapRunMode(v(P.status) as number),
      cleanMode:    mapCleanMode(v(P.cleaning_mode) as number),
      batteryLevel: (v(P.battery) as number) ?? 0,
      waterLevel:   mapWaterLevel(v(P.water_volume) as number | undefined),
      errorCode:    mapErrorCode((v(P.error_code) as number) ?? 0),
      taskStatus:   (v(P.task_status) as number) ?? 0,
    }
  }

  async getInfo(): Promise<{ model: string; firmwareVersion: string; serialNumber: string }> {
    const did = String(this.deviceId)
    const params = MIOT_PROPS.map(p => ({ did, siid: p.siid, piid: p.piid }))
    const results = await this.connector.miotCall(did, 'get_properties', params) as Array<{ value: unknown }>
    return {
      model:           this.model,
      firmwareVersion: String(results[P.fw_version]?.value ?? ''),
      serialNumber:    String(results[P.serial_number]?.value ?? ''),
    }
  }

  async doAction(name: ActionName, extraInput: unknown[] = []): Promise<void> {
    const a = ACTIONS[name]
    if ('mapMode' in a && a.mapMode) {
      await this.connector.miotAction(this.deviceId, 4, 1, [{ piid: 1, value: 21 }])
    } else {
      await this.connector.miotAction(this.deviceId, a.siid, a.aiid, extraInput)
    }
  }

  async setProperty(siid: number, piid: number, value: unknown): Promise<void> {
    const did = String(this.deviceId)
    await this.connector.miotCall(did, 'set_properties', [{ did, siid, piid, value }])
  }

  async startCleanSegments(
    segmentIds: number[],
    opts: { repeat?: number; suction?: number; water?: number } = {},
  ): Promise<void> {
    const { repeat = 1, suction = 2, water = 2 } = opts
    const cleanlist = segmentIds.map((id, i) => [id, repeat, suction, water, i + 1])
    await this.connector.miotAction(this.deviceId, 4, 1, [
      { piid: 1,  value: 18 },
      { piid: 10, value: JSON.stringify({ selects: cleanlist }) },
    ])
  }

  async startCleanZone(
    zones: Array<{ x1: number; y1: number; x2: number; y2: number }>,
    opts: { repeat?: number; suction?: number; water?: number } = {},
  ): Promise<void> {
    const { repeat = 1, suction = 2, water = 2 } = opts
    const cleanlist = zones.map(z => [
      Math.round(z.x1), Math.round(z.y1), Math.round(z.x2), Math.round(z.y2),
      repeat, suction, water,
    ])
    await this.connector.miotAction(this.deviceId, 4, 1, [
      { piid: 1,  value: 19 },
      { piid: 10, value: JSON.stringify({ areas: cleanlist }) },
    ])
  }

  async getMapsAndRooms(): Promise<VacuumMap[]> {
    const did = String(this.deviceId)
    const results = await this.connector.miotCall(did, 'get_properties', [
      { did, siid: 6, piid: 8 },
    ]) as Array<{ value: unknown }>

    const mapListRaw = results[0]?.value as string | undefined
    if (!mapListRaw) return []

    let objectName: string
    try {
      objectName = (JSON.parse(mapListRaw) as { object_name: string }).object_name
    } catch { return [] }

    const url = await this.connector.getFileUrl(objectName)
    if (!url) return []

    const raw = await this._fetchUrl(url)

    let outer: { mapstr?: Array<{ id?: string; map?: string }> }
    try { outer = JSON.parse(raw.toString('utf8')) } catch { return [] }

    const rooms = this._parseMapBinary(outer.mapstr?.[0]?.map)
    const mapId = String(outer.mapstr?.[0]?.id ?? '0')
    const areas: Area[] = (rooms ?? []).map(r => ({ id: String(r.id), name: r.name, mapId }))

    return [{ id: mapId, name: 'Map 1', areas }]
  }

  private async _fetchUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? httpsGet : httpGet
      client(url, res => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }).on('error', reject)
    })
  }

  private _parseMapBinary(mapBase64: string | undefined): Array<{ id: number; name: string; type: number }> | null {
    if (!mapBase64) return null
    const ROOM_TYPES: Record<number, string> = {
      0: 'Room', 1: 'Living Room', 2: 'Master Bedroom', 3: 'Bedroom',
      4: 'Study', 5: 'Kitchen', 6: 'Bathroom', 7: 'Balcony',
      8: 'Corridor', 9: 'Laundry', 10: 'Lounge', 15: 'Secondary Bedroom',
    }
    const mapBin = Buffer.from(mapBase64.replace(/_/g, '/').replace(/-/g, '+'), 'base64')
    let dec: Buffer
    try { dec = inflateSync(mapBin) } catch { return null }

    const HEADER_SIZE = 27
    const width  = dec.readUInt16LE(19)
    const height = dec.readUInt16LE(21)
    const jsonOffset = HEADER_SIZE + width * height
    if (dec.length <= jsonOffset) return null

    let dataJson: { seg_inf?: Record<string, { name?: string; type?: number }> }
    try { dataJson = JSON.parse(dec.slice(jsonOffset).toString('utf8')) } catch { return null }

    const segInf = dataJson?.seg_inf
    if (!segInf) return null

    return Object.entries(segInf).map(([id, info]) => {
      let name = info.name ? Buffer.from(info.name, 'base64').toString('utf8') : null
      if (!name) name = ROOM_TYPES[info.type ?? 0] ?? `Room ${id}`
      return { id: Number(id), name, type: info.type ?? 0 }
    }).sort((a, b) => a.id - b.id)
  }
}
