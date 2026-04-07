# Changelog

## [0.0.3-alpha] — unreleased

### Added

- **Connected Pet Fountain** — full support for Xiaomi Smart Pet Fountain 2 (MJCWYSJ03 / `xiaomi.pet_waterer.iv02`) and `mmgg.pet_waterer.wi11`
  - `PetFountain`: complete MIoT mapping (pump on/off, dispensing mode, battery level, filter lifetime, water shortage detection, fault codes)
  - `PetFountainClient`: EventEmitter client with polling tuned for battery-powered Wi-Fi sleep behavior (30 s by default), events `statusChange`, `faultChange`, `modeChange`, `waterShortage`, `error`
  - Dispensing modes: `continuous`, `intermittent`, `sensor` (PIR detection)
  - Fault codes: `waterShortage`, `pumpBlocked`, `filterExpired`, `lidRemoved`
- **Device registry** (`createDevice`) — factory that automatically resolves device type from the MIoT model, with fallback to `BaseDevice` for unknown models
- **CLI** — `fountain` command group: `status`, `on`, `off`, `set-mode`, `reset-filter`, `watch`
- **RiceCooker** — stub registered in the device registry (ready for future implementation)

---

## [0.0.2-alpha] — 2026-04-07

### Added

- `@mibridge/core` foundation: `DreameVacuumClient`, `MiConnector`, Xiaomi Cloud authentication (OTP), session persistence, `listDevices`
- `@mibridge/cli` foundation: commands `login`, `logout`, `devices`, `status`, `do`, `clean`, `rooms`, `maps`, `watch`
- Initial support for Dreame vacuums (models `r2205`, `p2028`, `p2029`, `p2114`, `p2150a`, `p2150b`)
- Internationalization (EN / FR)

---

## [0.0.1-alpha] — 2026-04-07

### Added

- Monorepo scaffold (`packages/core`, `packages/cli`)
- TypeScript ESM (NodeNext), Vitest, npm workspaces configuration
