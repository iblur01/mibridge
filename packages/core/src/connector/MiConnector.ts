import nodeMihome from 'node-mihome'
import type { Session, DeviceInfo } from '../types.js'

// node-mihome is a CJS package — default import gives us the module object
const { miCloudProtocol } = nodeMihome as {
  miCloudProtocol: {
    userId: string | null
    ssecurity: string | null
    serviceToken: string | null
    getDevices: (a: undefined, opts: { country: string }) => Promise<DeviceInfo[]>
    miioCall: (id: string, method: string, params: unknown[], opts: { country: string }) => Promise<unknown>
    request: (path: string, body: unknown, country: string) => Promise<{ result: unknown }>
  }
}

export class MiConnector {
  private country: string

  constructor(country = 'de') {
    this.country = country
  }

  injectSession(session: Session): void {
    miCloudProtocol.userId = session.userId
    miCloudProtocol.ssecurity = session.ssecurity
    miCloudProtocol.serviceToken = session.serviceToken
  }

  async getDevices(): Promise<DeviceInfo[]> {
    return miCloudProtocol.getDevices(undefined, { country: this.country })
  }

  async miioCall(deviceId: string, method: string, params: unknown[] = []): Promise<unknown> {
    return miCloudProtocol.miioCall(deviceId, method, params, { country: this.country })
  }

  async miotCall(deviceId: string, method: string, params: unknown[] = []): Promise<unknown[]> {
    const data = await miCloudProtocol.request(
      `/v2/home/rpc/${deviceId}`,
      { method, params },
      this.country,
    )
    return data.result as unknown[]
  }

  async miotAction(deviceId: string, siid: number, aiid: number, input: unknown[] = []): Promise<unknown> {
    const data = await miCloudProtocol.request(
      `/v2/home/rpc/${deviceId}`,
      { method: 'action', params: { did: String(deviceId), siid, aiid, in: input } },
      this.country,
    )
    return (data as { result: unknown }).result
  }

  async getFileUrl(objectName: string): Promise<string | null> {
    const data = await miCloudProtocol.request(
      '/v2/home/get_interim_file_url',
      { obj_name: objectName },
      this.country,
    )
    return (data as { result?: { url?: string } }).result?.url ?? null
  }
}
