# mibridge

[![npm @mibridge/core](https://img.shields.io/npm/v/@mibridge/core.svg?label=@mibridge/core)](https://www.npmjs.com/package/@mibridge/core)
[![npm @mibridge/cli](https://img.shields.io/npm/v/@mibridge/cli.svg?label=@mibridge/cli)](https://www.npmjs.com/package/@mibridge/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

Open-source TypeScript SDK and CLI for controlling Xiaomi smart home devices through the Xiaomi Cloud API, with device state standardized against the Matter specification.

## Overview

mibridge acts as a bridge between Xiaomi's proprietary cloud protocol and standardized smart home interfaces. It abstracts the MIoT property system (service IDs, property IDs, action IDs) into a typed, event-driven API, and maps device states and error codes to Matter 1.4 cluster semantics for interoperability with other smart home ecosystems.

The project is structured as a monorepo with two packages:

- **@mibridge/core** — SDK library for programmatic device control
- **@mibridge/cli** — Command-line interface built on top of the SDK

Currently supported devices are Dreame robot vacuums, with the architecture designed to accommodate additional Xiaomi device categories.

## Motivation

Xiaomi devices communicate through a proprietary cloud protocol (MIoT) with device-specific property indices and error codes. This makes it difficult to build reliable integrations, automate workflows, or reason about device state in a consistent way.

mibridge solves this by:

- Wrapping the MIoT protocol in a stable, typed API
- Translating device-specific error codes and states into Matter 1.4 enums
- Exposing an event-driven interface for real-time state observation
- Providing session-based authentication with OTP/2FA support

## Packages

### @mibridge/core — [full documentation](packages/core/README.md)

The core SDK. Handles authentication, session management, device communication, and state normalization.

```typescript
import { DreameVacuumClient, CleanMode, WaterLevel } from "@mibridge/core";

const client = new DreameVacuumClient({ deviceId, region: "de" });
await client.connect();

client.on("statusChange", (status) => {
  console.log(status.state, status.batteryLevel);
});

await client.setCleanMode(CleanMode.VacuumThenMop);
await client.startCleaningAreas(["room-1", "room-2"], {
  suction: "strong",
  repeat: 2,
});
```

Key exports:

- `DreameVacuumClient` — main device client (EventEmitter)
- `MiCloudAuth` — Xiaomi cloud authentication with OTP support
- `listDevices` — discover devices linked to an account
- `VacuumState`, `CleanMode`, `WaterLevel`, `VacuumErrorCode` — Matter-aligned enums
- `saveSession`, `loadSession`, `clearSession` — session persistence

### @mibridge/cli — [full documentation](packages/cli/README.md)

A `mibridge` binary for interacting with devices from the terminal.

```
mibridge login --region de
mibridge devices
mibridge status <device-id>
mibridge clean <device-id> --rooms 1,2,3 --mode vacuum --suction strong
mibridge watch <device-id> --interval 3000
```

Available commands: `login`, `logout`, `devices`, `status`, `clean`, `rooms`, `maps`, `watch`, `do`

## Matter Alignment

Device error codes and operational states are mapped to Matter ServiceArea cluster semantics:

| Matter enum | Xiaomi condition |
|---|---|
| `DustBinMissing` / `DustBinFull` | Dust bin errors |
| `WaterTankEmpty` / `WaterTankMissing` / `WaterTankLidOpen` | Water tank errors |
| `MopPadMissing` | Mop pad not installed |
| `BatteryLow` | Low battery |
| `Stuck` / `BrushJammed` / `NavigationObscured` | Movement errors |

This allows mibridge to serve as an adaptation layer for Matter-compatible home automation controllers without requiring per-device error handling logic.

## Installation

```bash
# SDK only
npm install @mibridge/core

# CLI (global)
npm install -g @mibridge/cli
```

## Configuration

Create a `.xiaomirc` file in your working directory:

```json
{
  "region": "de",
  "aliases": {
    "vacuum": "DEVICE_ID_HERE"
  }
}
```

See `.xiaomirc.example` for the full reference. Sessions are persisted to `~/.config/xiaomi-cli/session.json` and can be overridden with the `XIAOMI_SESSION_DIR` environment variable.

## Development

This project uses npm workspaces and Vitest.

```bash
npm install
npm run build       # build all packages
npm test            # run tests
```

TypeScript, ES2022, NodeNext module resolution.

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

## License

MIT — see [LICENSE](LICENSE) for details.

---

[![GitHub stars](https://img.shields.io/github/stars/iblur01/mibridge?style=social)](https://github.com/iblur01/mibridge/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/iblur01/mibridge?style=social)](https://github.com/iblur01/mibridge/network/members)
[![GitHub issues](https://img.shields.io/github/issues/iblur01/mibridge)](https://github.com/iblur01/mibridge/issues)
