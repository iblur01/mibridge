jest.mock('node-mihome', () => ({
  miCloudProtocol: {
    userId: null,
    ssecurity: null,
    serviceToken: null,
    getDevices: jest.fn(),
    miioCall: jest.fn()
  }
}))

const { miCloudProtocol } = require('node-mihome')
const MiConnector = require('../../src/connector/MiConnector')

describe('MiConnector', () => {
  const session = { userId: '123', ssecurity: 'sec', serviceToken: 'tok' }
  let connector

  beforeEach(() => {
    connector = new MiConnector('eu')
    jest.clearAllMocks()
  })

  test('injectSession sets node-mihome protocol properties', () => {
    connector.injectSession(session)
    expect(miCloudProtocol.userId).toBe('123')
    expect(miCloudProtocol.ssecurity).toBe('sec')
    expect(miCloudProtocol.serviceToken).toBe('tok')
  })

  test('getDevices() calls miCloudProtocol.getDevices', async () => {
    const devices = [{ did: '1', model: 'chunmi.cooker.normal5', name: 'Rice' }]
    miCloudProtocol.getDevices.mockResolvedValue(devices)
    connector.injectSession(session)
    const result = await connector.getDevices()
    expect(miCloudProtocol.getDevices).toHaveBeenCalled()
    expect(result).toEqual(devices)
  })

  test('miioCall() delegates to miCloudProtocol.miioCall', async () => {
    miCloudProtocol.miioCall.mockResolvedValue({ result: ['cooking'] })
    connector.injectSession(session)
    const result = await connector.miioCall('dev1', 'get_prop', ['stage'])
    expect(miCloudProtocol.miioCall).toHaveBeenCalledWith('dev1', 'get_prop', ['stage'], { country: 'eu' })
    expect(result).toEqual({ result: ['cooking'] })
  })
})
