export const en = {
  // session
  'session.notLoggedIn': 'Not logged in. Run: mibridge login',

  // login
  'login.description': 'Sign in to your Xiaomi account (OTP supported)',
  'login.option.region': 'Xiaomi cloud region',
  'login.prompt.username': 'Xiaomi email / phone:',
  'login.prompt.password': 'Password:',
  'login.2fa.required': '\n2FA verification required.',
  'login.2fa.openLink': 'Open this link in your browser to receive the code:',
  'login.2fa.doNotValidate': 'Do NOT validate on the web page — come back here and enter the code.\n',
  'login.2fa.prompt': 'Verification code:',
  'login.2fa.tooManyAttempts': 'Too many attempts.',
  'login.2fa.failed': 'Failed ({message}), try again.',
  'login.success': 'Logged in. Session saved.',
  'login.error': 'Login failed: {message}',

  // logout
  'logout.description': 'Clear the local session',
  'logout.success': 'Session cleared.',

  // devices
  'devices.description': 'List all devices on the account',
  'devices.none': 'No devices found.',
  'devices.header.id': 'ID',
  'devices.header.model': 'Model',
  'devices.header.name': 'Name',
  'devices.error': 'Error: {message}',

  // status
  'status.description': 'Show the current state of a device',
  'status.header': '\nVacuum status:',
  'status.error': 'Error: {message}',

  // do
  'do.description': 'Trigger an action ({actions})',
  'do.success': '✓ {action} sent',
  'do.unknownAction': 'Unknown action: {action}. Available: {actions}',
  'do.error': 'Error: {message}',

  // clean
  'clean.description': 'Start a cleaning session',
  'clean.option.rooms': 'Comma-separated room IDs (e.g. 1,2,3)',
  'clean.option.mode': 'vacuum|mop|vacuumThenMop',
  'clean.option.suction': 'quiet|standard|strong|turbo',
  'clean.option.water': 'low|medium|high',
  'clean.option.repeat': 'Number of passes',
  'clean.rooms.success': '✓ Cleaning rooms [{ids}] started',
  'clean.full.success': '✓ Full cleaning started',
  'clean.error': 'Error: {message}',

  // rooms
  'rooms.description': 'List configured rooms',
  'rooms.header': '\nRooms:',
  'rooms.none': 'No rooms configured (run a full clean to map the space).',
  'rooms.hint': '\nTo clean: mibridge clean {deviceId} --rooms <id1,id2,...>\n',
  'rooms.error': 'Error: {message}',

  // maps
  'maps.description': 'List available maps',
  'maps.none': 'No maps available.',
  'maps.map': '\nMap: {name} (ID: {id})',
  'maps.error': 'Error: {message}',

  // watch
  'watch.description': 'Monitor device state in real time (Ctrl+C to quit)',
  'watch.option.interval': 'Polling interval in ms',
  'watch.intro': 'Watching {deviceId} (interval {interval}ms) — Ctrl+C to quit\n',
  'watch.status': '[{time}] state={state} battery={battery}% mode={mode}',
  'watch.stateChange': '  → state: {state}',
  'watch.modeChange': '  → cleanMode: {mode}',
  'watch.operationComplete': '  ✓ Operation complete — error: {error}, duration: {duration}s',
  'watch.error': '  ✗ Error: {message}',

  // fountain
  'fountain.description': 'Manage a Xiaomi smart pet fountain',
  'fountain.status.description': 'Show the current state of the fountain',
  'fountain.status.header': '\nFountain status:',
  'fountain.on.description': 'Turn the pump on',
  'fountain.on.success': '✓ Pump turned on',
  'fountain.off.description': 'Turn the pump off',
  'fountain.off.success': '✓ Pump turned off',
  'fountain.setMode.description': 'Set distribution mode (continuous|intermittent|sensor)',
  'fountain.setMode.success': '✓ Mode set to {mode}',
  'fountain.setMode.invalid': 'Invalid mode: {mode}. Valid: continuous, intermittent, sensor',
  'fountain.resetFilter.description': 'Reset the filter life counter to 100%',
  'fountain.resetFilter.success': '✓ Filter counter reset',
  'fountain.watch.description': 'Monitor fountain state in real time (Ctrl+C to quit)',
  'fountain.watch.option.interval': 'Polling interval in ms (default: 30000)',
  'fountain.watch.intro': 'Watching fountain {deviceId} (interval {interval}ms) — Ctrl+C to quit\n',
  'fountain.watch.status': '[{time}] on={on} mode={mode} battery={battery}% filter={filter}%',
  'fountain.watch.faultChange': '  ⚠ fault: {fault}',
  'fountain.watch.waterShortage': '  ⚠ water shortage: {shortage}',
  'fountain.watch.modeChange': '  → mode: {mode}',
  'fountain.error': 'Error: {message}',
} as const

export type TranslationKey = keyof typeof en
