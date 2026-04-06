const PetFountain = require('../../src/devices/PetFountain')

describe('PetFountain', () => {
  const connector = { miioCall: jest.fn() }
  const deviceInfo = { did: 'fount1', model: 'mmgg.pet_waterer.wi11', name: 'Fontaine' }

  beforeEach(() => jest.clearAllMocks())

  test('models includes mmgg.pet_waterer.wi11 and mmgg.pet_waterer.s1', () => {
    expect(PetFountain.models).toContain('mmgg.pet_waterer.wi11')
    expect(PetFountain.models).toContain('mmgg.pet_waterer.s1')
  })

  test('getStatus() calls get_prop with correct property list', async () => {
    connector.miioCall.mockResolvedValue({ result: ['false', 'false', '73', 'on'] })
    const device = new PetFountain(connector, deviceInfo)
    await device.getStatus()
    expect(connector.miioCall).toHaveBeenCalledWith(
      'fount1', 'get_prop', ['no_water_flag', 'pump_block', 'filter_life', 'on_off']
    )
  })

  test('getStatus() returns object with property names as keys', async () => {
    connector.miioCall.mockResolvedValue({ result: ['false', 'false', '73', 'on'] })
    const device = new PetFountain(connector, deviceInfo)
    const status = await device.getStatus()
    expect(status).toEqual({ no_water_flag: 'false', pump_block: 'false', filter_life: '73', on_off: 'on' })
  })
})
