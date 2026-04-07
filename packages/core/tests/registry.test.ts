import { describe, test, expect } from 'vitest'
import { createDevice } from '../src/registry.js'
import { DreameVacuum } from '../src/devices/DreameVacuum.js'
import { PetFountain } from '../src/devices/PetFountain.js'
import { RiceCooker } from '../src/devices/RiceCooker.js'
import { BaseDevice } from '../src/devices/BaseDevice.js'
import { DmakerFan1C } from '../src/devices/DmakerFan1C.js'
import type { MiConnector } from '../src/connector/MiConnector.js'

const connector = {
  miotCall:      () => Promise.resolve([]),
  miotAction:    () => Promise.resolve({}),
  getDevices:    () => Promise.resolve([]),
  injectSession: () => {},
} as unknown as MiConnector

describe('createDevice()', () => {
  test('returns DreameVacuum for dreame.vacuum.r2205', () => {
    const d = createDevice(connector, { did: '1', model: 'dreame.vacuum.r2205', name: 'Vacuum' })
    expect(d).toBeInstanceOf(DreameVacuum)
  })

  test('returns RiceCooker for chunmi.cooker.normal5', () => {
    const d = createDevice(connector, { did: '2', model: 'chunmi.cooker.normal5', name: 'Cuiseur' })
    expect(d).toBeInstanceOf(RiceCooker)
  })

  test('returns RiceCooker for chunmi.cooker.normal2', () => {
    const d = createDevice(connector, { did: '3', model: 'chunmi.cooker.normal2', name: 'Cuiseur' })
    expect(d).toBeInstanceOf(RiceCooker)
  })

  test('returns PetFountain for xiaomi.pet_waterer.iv02', () => {
    const d = createDevice(connector, { did: '4', model: 'xiaomi.pet_waterer.iv02', name: 'Fontaine' })
    expect(d).toBeInstanceOf(PetFountain)
  })

  test('returns PetFountain for mmgg.pet_waterer.wi11', () => {
    const d = createDevice(connector, { did: '5', model: 'mmgg.pet_waterer.wi11', name: 'Fontaine' })
    expect(d).toBeInstanceOf(PetFountain)
  })

  test('returns DmakerFan1C for dmaker.fan.1c', () => {
    const d = createDevice(connector, { did: '7', model: 'dmaker.fan.1c', name: 'Ventilateur' })
    expect(d).toBeInstanceOf(DmakerFan1C)
  })

  test('returns BaseDevice for unknown model', () => {
    const d = createDevice(connector, { did: '6', model: 'unknown.device.v1', name: 'Unknown' })
    expect(d).toBeInstanceOf(BaseDevice)
    expect(d).not.toBeInstanceOf(DreameVacuum)
    expect(d).not.toBeInstanceOf(PetFountain)
    expect(d).not.toBeInstanceOf(RiceCooker)
  })
})
