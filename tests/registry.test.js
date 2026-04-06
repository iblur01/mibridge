const { createDevice } = require('../src/registry')
const RiceCooker = require('../src/devices/RiceCooker')
const PetFountain = require('../src/devices/PetFountain')
const BaseDevice = require('../src/devices/BaseDevice')

const connector = { miioCall: jest.fn() }

describe('registry createDevice()', () => {
  test('returns RiceCooker for chunmi.cooker.normal5', () => {
    const d = createDevice(connector, { did: '1', model: 'chunmi.cooker.normal5', name: 'Cuiseur' })
    expect(d).toBeInstanceOf(RiceCooker)
  })

  test('returns RiceCooker for chunmi.cooker.normal2', () => {
    const d = createDevice(connector, { did: '1', model: 'chunmi.cooker.normal2', name: 'Cuiseur' })
    expect(d).toBeInstanceOf(RiceCooker)
  })

  test('returns PetFountain for mmgg.pet_waterer.wi11', () => {
    const d = createDevice(connector, { did: '2', model: 'mmgg.pet_waterer.wi11', name: 'Fontaine' })
    expect(d).toBeInstanceOf(PetFountain)
  })

  test('returns BaseDevice (fallback) for unknown model', () => {
    const d = createDevice(connector, { did: '3', model: 'unknown.device.v1', name: 'Unknown' })
    expect(d).toBeInstanceOf(BaseDevice)
    expect(d).not.toBeInstanceOf(RiceCooker)
    expect(d).not.toBeInstanceOf(PetFountain)
  })
})
