// Public API — everything a consumer needs
export { DreameVacuumClient } from './client.js'
export { PetFountainClient } from './fountainClient.js'
export { createDevice } from './registry.js'
export * from './types.js'
export { VacuumError } from './errors.js'
export { MiCloudAuth } from './auth/MiCloudAuth.js'
export { saveSession, loadSession, clearSession } from './auth/session.js'
export { listDevices } from './listDevices.js'
