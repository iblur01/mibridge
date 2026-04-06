const RiceCooker = require('../../src/devices/RiceCooker')

describe('RiceCooker', () => {
  const connector = { miioCall: jest.fn() }
  const deviceInfo = { did: 'rice1', model: 'chunmi.cooker.normal5', name: 'Cuiseur' }

  beforeEach(() => jest.clearAllMocks())

  test('models includes chunmi.cooker.normal2 and chunmi.cooker.normal5', () => {
    expect(RiceCooker.models).toContain('chunmi.cooker.normal2')
    expect(RiceCooker.models).toContain('chunmi.cooker.normal5')
  })

  test('getStatus() calls get_prop with correct property list', async () => {
    connector.miioCall.mockResolvedValue({ result: ['cooking', 'rice', '2', '98', '30', 'normal'] })
    const device = new RiceCooker(connector, deviceInfo)
    await device.getStatus()
    expect(connector.miioCall).toHaveBeenCalledWith(
      'rice1', 'get_prop', ['func', 'menu', 'stage', 'temp', 't_cook', 'setting']
    )
  })

  test('getStatus() returns object with property names as keys', async () => {
    connector.miioCall.mockResolvedValue({ result: ['cooking', 'rice', '2', '98', '30', 'normal'] })
    const device = new RiceCooker(connector, deviceInfo)
    const status = await device.getStatus()
    expect(status).toEqual({ func: 'cooking', menu: 'rice', stage: '2', temp: '98', t_cook: '30', setting: 'normal' })
  })
})
