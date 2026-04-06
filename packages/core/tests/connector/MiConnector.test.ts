import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('node-mihome', async () => {
  return {
    default: {
      miCloudProtocol: {
        userId: null,
        ssecurity: null,
        serviceToken: null,
        getDevices: vi.fn(),
        miioCall: vi.fn(),
        request: vi.fn(),
      },
    },
  }
})

import { MiConnector } from '../../src/connector/MiConnector.js'
import nodeMihome from 'node-mihome'

// After import, get reference to the mock protocol
const mockProtocol = (nodeMihome as any).miCloudProtocol

describe('MiConnector', () => {
  const session = { userId: '123', ssecurity: 'sec', serviceToken: 'tok', savedAt: '' }
  let connector: MiConnector

  beforeEach(() => {
    connector = new MiConnector('eu')
    vi.clearAllMocks()
  })

  test('injectSession sets node-mihome protocol properties', () => {
    connector.injectSession(session)
    expect(mockProtocol.userId).toBe('123')
    expect(mockProtocol.ssecurity).toBe('sec')
    expect(mockProtocol.serviceToken).toBe('tok')
  })

  test('getDevices() calls protocol.getDevices', async () => {
    const devices = [{ did: '1', model: 'dreame.vacuum.r2205', name: 'Dreame' }]
    mockProtocol.getDevices.mockResolvedValue(devices)
    connector.injectSession(session)
    const result = await connector.getDevices()
    expect(mockProtocol.getDevices).toHaveBeenCalled()
    expect(result).toEqual(devices)
  })

  test('miioCall() delegates to protocol.miioCall', async () => {
    mockProtocol.miioCall.mockResolvedValue({ result: ['ok'] })
    connector.injectSession(session)
    const result = await connector.miioCall('dev1', 'get_prop', ['stage'])
    expect(mockProtocol.miioCall).toHaveBeenCalledWith('dev1', 'get_prop', ['stage'], { country: 'eu' })
    expect(result).toEqual({ result: ['ok'] })
  })

  test('miotCall() posts to /v2/home/rpc/:did and returns result', async () => {
    mockProtocol.request.mockResolvedValue({ result: [{ value: 6 }] })
    connector.injectSession(session)
    const result = await connector.miotCall('dev1', 'get_properties', [{ did: 'dev1', siid: 3, piid: 1 }])
    expect(mockProtocol.request).toHaveBeenCalledWith(
      '/v2/home/rpc/dev1',
      { method: 'get_properties', params: [{ did: 'dev1', siid: 3, piid: 1 }] },
      'eu',
    )
    expect(result).toEqual([{ value: 6 }])
  })
})
