const BaseDevice = require('../../src/devices/BaseDevice')

describe('BaseDevice', () => {
  const connector = { miioCall: jest.fn() }
  const deviceInfo = { did: 'dev1', model: 'test.model.v1', name: 'Test Device' }

  test('constructor sets deviceId, model, name', () => {
    const device = new BaseDevice(connector, deviceInfo)
    expect(device.deviceId).toBe('dev1')
    expect(device.model).toBe('test.model.v1')
    expect(device.name).toBe('Test Device')
  })

  test('call() delegates to connector.miioCall with deviceId', async () => {
    connector.miioCall.mockResolvedValue({ result: ['on'] })
    const device = new BaseDevice(connector, deviceInfo)
    const result = await device.call('get_prop', ['power'])
    expect(connector.miioCall).toHaveBeenCalledWith('dev1', 'get_prop', ['power'])
    expect(result).toEqual({ result: ['on'] })
  })

  test('getStatus() throws Not implemented', async () => {
    const device = new BaseDevice(connector, deviceInfo)
    await expect(device.getStatus()).rejects.toThrow('Not implemented')
  })
})
