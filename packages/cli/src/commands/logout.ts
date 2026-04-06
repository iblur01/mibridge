import type { Command } from 'commander'
import { clearSession } from '@mibridge/core'
import { t } from '../i18n.js'

export function register(program: Command): void {
  program
    .command('logout')
    .description(t('logout.description'))
    .action(() => {
      clearSession()
      console.log(t('logout.success'))
    })
}
