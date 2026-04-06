import { describe, test, expect } from 'vitest'
import { VacuumError } from '../src/errors.js'
import { VacuumErrorCode } from '../src/types.js'

describe('VacuumError', () => {
  test('has code and message', () => {
    const e = new VacuumError(VacuumErrorCode.Stuck, 'robot is stuck')
    expect(e).toBeInstanceOf(Error)
    expect(e.code).toBe(VacuumErrorCode.Stuck)
    expect(e.message).toBe('robot is stuck')
    expect(e.name).toBe('VacuumError')
  })

  test('defaults message to code string', () => {
    const e = new VacuumError(VacuumErrorCode.BatteryLow)
    expect(e.message).toBe(VacuumErrorCode.BatteryLow)
  })
})
