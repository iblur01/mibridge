# @mibridge/cli

[![npm version](https://img.shields.io/npm/v/@mibridge/cli.svg)](https://www.npmjs.com/package/@mibridge/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%99%A5-red)](https://github.com/iblur01/mibridge)

Command-line interface for controlling Xiaomi smart home devices. Built on top of [@mibridge/core](../core).

Part of the [mibridge](https://github.com/iblur01/mibridge) project.

## Installation

```bash
npm install -g @mibridge/cli
```

## Requirements

- Node.js 18 or later
- A Xiaomi account with devices linked to it

## Getting started

```bash
# Authenticate with your Xiaomi account
mibridge login --region de

# List your devices
mibridge devices

# Check device status
mibridge status <device-id>
```

## Commands

### `login`

Authenticate with your Xiaomi account. Supports OTP/2FA.

```bash
mibridge login --region de
```

| Option | Default | Description |
|---|---|---|
| `--region` | `de` | Cloud region (`cn`, `de`, `eu`, ...) |

### `logout`

Clear the saved session.

```bash
mibridge logout
```

### `devices`

List all devices linked to your account.

```bash
mibridge devices
```

### `status`

Display the current state of a device.

```bash
mibridge status <device-id>
```

### `clean`

Start a cleaning session. Without options, cleans the entire map.

```bash
mibridge clean <device-id>
mibridge clean <device-id> --rooms 1,2,3 --mode vacuum --suction strong --water medium
```

| Option | Description |
|---|---|
| `--rooms` | Comma-separated room IDs to clean |
| `--mode` | Clean mode: `vacuum`, `mop`, `vacuumThenMop` |
| `--suction` | Suction level: `quiet`, `standard`, `strong`, `turbo` |
| `--water` | Water level: `off`, `low`, `medium`, `high` |
| `--repeat` | Number of passes per room (default: `1`) |

### `rooms`

List the rooms available on a device's map.

```bash
mibridge rooms <device-id>
```

### `maps`

List the maps saved on a device.

```bash
mibridge maps <device-id>
```

### `watch`

Stream real-time status updates from a device.

```bash
mibridge watch <device-id>
mibridge watch <device-id> --interval 2000
```

| Option | Default | Description |
|---|---|---|
| `--interval` | `5000` | Poll interval in milliseconds |

### `do`

Execute a raw MIoT action on a device. Useful for debugging or accessing features not yet exposed by the SDK.

```bash
mibridge do <device-id> <siid> <aiid> [params]
```

## Configuration

Create a `.xiaomirc` file in your working directory to set defaults:

```json
{
  "region": "de",
  "aliases": {
    "vacuum": "DEVICE_ID_HERE"
  }
}
```

With aliases configured, you can use the alias instead of the full device ID:

```bash
mibridge status vacuum
mibridge clean vacuum --rooms 1,2
```

See `.xiaomirc.example` at the root of the repository for the full reference.

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

## License

MIT — see [LICENSE](../../LICENSE) for details.
