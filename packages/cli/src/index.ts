#!/usr/bin/env node
import { Command } from 'commander'
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

const program = new Command()
program.name('xiaomi').version('0.1.0')

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

program.parse(process.argv)
