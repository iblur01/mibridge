import { MiConnector } from './connector/MiConnector.js'
import type { Session, DeviceInfo } from './types.js'

export async function listDevices(session: Session, region = 'de'): Promise<DeviceInfo[]> {
  const connector = new MiConnector(region)
  connector.injectSession(session)
  return connector.getDevices()
}
