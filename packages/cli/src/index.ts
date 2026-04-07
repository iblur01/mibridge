#!/usr/bin/env node
import { createRequire } from 'node:module'
import { Command } from 'commander'

const { version } = createRequire(import.meta.url)('../package.json') as { version: string }
import { register as registerLogin }    from './commands/login.js'
import { register as registerLogout }   from './commands/logout.js'
import { register as registerDevices }  from './commands/devices.js'
import { register as registerStatus }   from './commands/status.js'
import { register as registerDo }       from './commands/do.js'
import { register as registerClean }    from './commands/clean.js'
import { register as registerRooms }    from './commands/rooms.js'
import { register as registerMaps }     from './commands/maps.js'
import { register as registerWatch }    from './commands/watch.js'
import { register as registerFountain } from './commands/fountain.js'
import { register as registerFan }      from './commands/fan.js'

const program = new Command()
program.name('xiaomi').version(version)

registerLogin(program)
registerLogout(program)
registerDevices(program)
registerStatus(program)
registerDo(program)
registerClean(program)
registerRooms(program)
registerMaps(program)
registerWatch(program)
registerFountain(program)
registerFan(program)

program.parse(process.argv)
