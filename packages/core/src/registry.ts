import { BaseDevice } from './devices/BaseDevice.js'
import { DreameVacuum } from './devices/DreameVacuum.js'
import { PetFountain } from './devices/PetFountain.js'
import { RiceCooker } from './devices/RiceCooker.js'
import type { MiConnector } from './connector/MiConnector.js'
import type { DeviceInfo } from './types.js'

type DeviceClass = { models: readonly string[]; new(connector: MiConnector, info: DeviceInfo): BaseDevice }

const REGISTRY: DeviceClass[] = [DreameVacuum, PetFountain, RiceCooker]

export function createDevice(connector: MiConnector, deviceInfo: DeviceInfo): BaseDevice {
  const Cls = REGISTRY.find(C => C.models.includes(deviceInfo.model))
  return Cls ? new Cls(connector, deviceInfo) : new BaseDevice(connector, deviceInfo)
}
