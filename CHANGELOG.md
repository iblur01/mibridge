# Changelog

## [1.0.2] — unreleased

### Added

- **Smart Fan support** — architecture extensible pour les ventilateurs Xiaomi, avec `BaseFan` (classe abstraite normalisée) et `DmakerFan1C` comme première implémentation concrète
  - `DmakerFan1C` : mapping MIoT complet pour `dmaker.fan.1c` — on/off, vitesse (niveaux 1–3), oscillation, mode, timer arrêt, bip sonore, LED, verrouillage physique
  - `FanClient` : EventEmitter avec polling (10 s), événements `statusChange`, `modeChange`, `speedChange`, `oscillationChange`, `error`
  - Modes : `straight` (vent direct), `sleep` (mode nuit)
  - Type `FanSpeed` discriminé (`level` | `percent`) — prêt pour les futurs modèles à vitesse continue (0–100 %)
- **CLI** — groupe de commandes `fan` : `status`, `on`, `off`, `toggle`, `set-speed`, `set-mode`, `oscillate`, `set-timer`, `set-buzzer`, `set-led`, `set-lock`, `watch`

### Changed

- Script de release : garde-fou — la release est bloquée si la branche courante n'est pas `main`

---

## [1.0.0] — 2026-04-07

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
