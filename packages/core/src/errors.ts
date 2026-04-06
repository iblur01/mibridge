import { VacuumErrorCode } from './types.js'

export class VacuumError extends Error {
  readonly code: VacuumErrorCode

  constructor(code: VacuumErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'VacuumError'
    this.code = code
  }
}
