import { BaseDevice } from './BaseDevice.js'
import type { FanMode, FanSpeed, FanStatus } from '../types.js'

export abstract class BaseFan extends BaseDevice {
  abstract getStatus(): Promise<FanStatus>
  abstract setOn(on: boolean): Promise<void>
  abstract setSpeed(speed: FanSpeed): Promise<void>
  abstract setMode(mode: FanMode): Promise<void>
  abstract setOscillating(on: boolean): Promise<void>
  abstract setTimer(minutes: number): Promise<void>
  abstract setBuzzer(on: boolean): Promise<void>
  abstract setLed(on: boolean): Promise<void>
  abstract setLocked(on: boolean): Promise<void>
  abstract toggle(): Promise<void>
}
