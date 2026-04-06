# @mibridge/core

[![npm version](https://img.shields.io/npm/v/@mibridge/core.svg)](https://www.npmjs.com/package/@mibridge/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%99%A5-red)](https://github.com/iblur01/mibridge)

TypeScript SDK for controlling Xiaomi smart home devices via the Xiaomi Cloud API. Provides a typed, event-driven interface with device states normalized against the Matter specification.

Part of the [mibridge](https://github.com/iblur01/mibridge) project.

## Installation

```bash
npm install @mibridge/core
```

## Requirements

- Node.js 18 or later
- A Xiaomi account with devices linked to it

## Usage

### Authentication

```typescript
import { MiCloudAuth, saveSession } from "@mibridge/core";

const auth = new MiCloudAuth({ region: "de" });
await auth.login("your@email.com", "yourpassword");

const session = auth.getSession();
await saveSession(session);
```

### Listing devices

```typescript
import { listDevices, loadSession } from "@mibridge/core";

const session = await loadSession();
const devices = await listDevices(session);
console.log(devices);
```

### Controlling a device

```typescript
import { DreameVacuumClient, CleanMode, WaterLevel } from "@mibridge/core";

const client = new DreameVacuumClient({
  deviceId: "your-device-id",
  region: "de",
});

await client.connect();

// Listen to state changes
client.on("statusChange", (status) => {
  console.log(status.state, status.batteryLevel);
});

client.on("operationComplete", (result) => {
  console.log(`Cleaned for ${result.durationMs}ms`);
});

// Control
await client.setCleanMode(CleanMode.VacuumThenMop);
await client.setWaterLevel(WaterLevel.Medium);
await client.start();

// Targeted room cleaning
const areas = await client.getAreas();
await client.startCleaningAreas(["room-1", "room-2"], {
  suction: "strong",
  repeat: 1,
});

await client.disconnect();
```

## API

### DreameVacuumClient

Main client class, extends `EventEmitter`.

**Constructor options**

| Option | Type | Description |
|---|---|---|
| `deviceId` | `string` | Device ID from your Xiaomi account |
| `region` | `string` | Cloud region (`cn`, `de`, `eu`, ...) |
| `pollInterval` | `number` | Status poll interval in ms (default: `5000`) |

**Methods**

| Method | Description |
|---|---|
| `connect()` | Authenticate and start polling |
| `disconnect()` | Stop polling and release resources |
| `getStatus()` | Get current device status |
| `start()` | Start cleaning |
| `pause()` | Pause cleaning |
| `resume()` | Resume cleaning |
| `stop()` | Stop and stay in place |
| `returnToDock()` | Return to charging dock |
| `startMapping()` | Start a mapping run |
| `setCleanMode(mode)` | Set clean mode |
| `setWaterLevel(level)` | Set water level |
| `getMaps()` | Get available maps |
| `getAreas(mapId?)` | Get rooms/areas for a map |
| `startCleaningAreas(ids, opts?)` | Clean specific rooms |
| `getBatteryLevel()` | Get battery percentage |
| `getInfo()` | Get device model and firmware info |

**Events**

| Event | Payload | Description |
|---|---|---|
| `connected` | — | Client connected |
| `disconnected` | — | Client disconnected |
| `statusChange` | `VacuumStatus` | Full status update |
| `stateChange` | `VacuumState` | State changed |
| `cleanModeChange` | `CleanMode` | Clean mode changed |
| `areaChange` | `string \| null` | Current area changed |
| `progressUpdate` | `AreaProgress[]` | Area progress update |
| `operationComplete` | `OperationResult` | Cleaning session ended |
| `error` | `VacuumError` | Error occurred |

### Enums

```typescript
enum VacuumState {
  Idle, Cleaning, Mapping, Returning, Docked, Paused, Error
}

enum CleanMode {
  Vacuum, Mop, VacuumThenMop
}

enum WaterLevel {
  Off, Low, Medium, High
}
```

### Session management

```typescript
import { saveSession, loadSession, clearSession } from "@mibridge/core";

await saveSession(session);         // persist to disk
const session = await loadSession(); // load from disk
await clearSession();               // delete session file
```

Sessions are stored in `~/.config/xiaomi-cli/session.json` by default. Override with the `XIAOMI_SESSION_DIR` environment variable.

## Matter Alignment

Error codes are mapped to Matter ServiceArea cluster semantics, making it straightforward to expose device state to Matter-compatible controllers without custom error handling logic.

| Matter enum | Condition |
|---|---|
| `DustBinMissing` / `DustBinFull` | Dust bin errors |
| `WaterTankEmpty` / `WaterTankMissing` / `WaterTankLidOpen` | Water tank errors |
| `MopPadMissing` | Mop pad not installed |
| `BatteryLow` | Low battery threshold reached |
| `Stuck` / `BrushJammed` / `NavigationObscured` | Movement errors |

## Supported devices

- `dreame.vacuum.r2205`
- `dreame.vacuum.p2028`
- `dreame.vacuum.p2029`
- `dreame.vacuum.p2114`
- `dreame.vacuum.p2150a`
- `dreame.vacuum.p2150b`

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

## License

MIT — see [LICENSE](../../LICENSE) for details.
