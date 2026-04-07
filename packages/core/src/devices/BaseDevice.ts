import type { MiConnector } from '../connector/MiConnector.js'
import type { DeviceInfo } from '../types.js'

export class BaseDevice {
  protected connector: MiConnector
  protected deviceInfo: DeviceInfo
  protected deviceId: string
  protected model: string
  protected name: string

  constructor(connector: MiConnector, deviceInfo: DeviceInfo) {
    this.connector = connector
    this.deviceInfo = deviceInfo
    this.deviceId = deviceInfo.did
    this.model = deviceInfo.model
    this.name = deviceInfo.name
  }
}
