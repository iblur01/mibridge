import type { Command } from 'commander'
import inquirer from 'inquirer'
import { MiCloudAuth, saveSession } from '@mibridge/core'
import { t } from '../i18n.js'

export function register(program: Command): void {
  program
    .command('login')
    .description(t('login.description'))
    .option('--region <region>', t('login.option.region'), 'de')
    .action(async (opts: { region: string }) => {
      const { username, password } = await inquirer.prompt([
        { type: 'input',    name: 'username', message: t('login.prompt.username') },
        { type: 'password', name: 'password', message: t('login.prompt.password'), mask: '*' },
      ])

      const auth = new MiCloudAuth(opts.region)

      try {
        const result = await auth.login(username as string, password as string)

        if (result.needs2FA) {
          console.log(t('login.2fa.required'))
          console.log(t('login.2fa.openLink'))
          console.log(`\n  ${result.notificationUrl}\n`)
          console.log(t('login.2fa.doNotValidate'))

          let attempts = 0
          while (attempts < 3) {
            const { otp } = await inquirer.prompt([{ type: 'input', name: 'otp', message: t('login.2fa.prompt') }])
            try {
              await auth.submitOTP(result.notificationUrl!, otp as string)
              break
            } catch (e) {
              attempts++
              if (attempts >= 3) { console.error(t('login.2fa.tooManyAttempts')); process.exit(1) }
              console.error(t('login.2fa.failed', { message: (e as Error).message }))
            }
          }
        }

        saveSession(auth.session!)
        console.log(t('login.success'))
      } catch (e) {
        console.error(t('login.error', { message: (e as Error).message }))
        process.exit(1)
      }
    })
}
