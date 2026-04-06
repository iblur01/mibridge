import type { Command } from 'commander'
import { listDevices } from '@mibridge/core'
import { requireSession, getRegion } from '../session.js'
import { t } from '../i18n.js'

export function register(program: Command): void {
  program
    .command('devices')
    .description(t('devices.description'))
    .action(async () => {
      const session = requireSession()
      try {
        const devices = await listDevices(session, getRegion())
        if (!devices || devices.length === 0) return console.log(t('devices.none'))

        const id = t('devices.header.id')
        const model = t('devices.header.model')
        const name = t('devices.header.name')
        console.log('\n' + '─'.repeat(62))
        console.log(`  ${id.padEnd(15)} ${model.padEnd(30)} ${name}`)
        console.log('─'.repeat(62))
        for (const d of devices) {
          console.log(`  ${String(d.did).padEnd(15)} ${String(d.model).padEnd(30)} ${d.name}`)
        }
        console.log('─'.repeat(62) + '\n')
      } catch (e) {
        console.error(t('devices.error', { message: (e as Error).message }))
        process.exit(1)
      }
    })
}
