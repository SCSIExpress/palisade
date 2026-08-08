# Rust

**Image:** `didstopia/rust-server:latest` (by didstopia) · **Ports (defaults):** 28015/udp game, 28016/udp Steam query (A2S), 28016/tcp RCON (same number, different protocol — stays LAN-only), 28082/tcp Rust+ companion app

**Join:** In Rust, press F1 to open the console and paste `connect <host>:28015`, or find the server by name on the Community tab. Friends outside your LAN use your public IP with the same port.

**Admin:** Legacy Source RCON — the panel runs the server with `RUST_RCON_WEB=0`, and legacy RCON is confirmed working on current Rust (no WebSocket adapter needed). The admin-password field sets the RCON password and enables the in-panel console; `status` powers player counts and the roster, and kick/ban/moderator actions go by SteamID.

## First boot
SteamCMD installs/updates the server on every boot into the single `/steamcmd/rust` bind (the panel budgets ~25 GB disk for the full install; the initial download was observed to be fast). Map generation follows the install and takes a while on larger worlds. The map field picks the procedural world size: Small 2000 / Medium 3000 / Large 4500 (`RUST_SERVER_WORLDSIZE`); seed and a custom map URL are in the Settings tab. Ready marker: `Server startup complete`.

## Gotchas
- Vanilla Rust has NO join-password concept — the join-password field is hidden. Access control is bans/whitelist via plugins (there is an Oxide/uMod toggle in the Settings tab; plugins live under `data/oxide`).
- Rust is RAM-hungry: ~6 GB on a small map, 10+ GB on default 3500-size worlds. Prefer the Small map on a shared box (the panel's estimate is 8 GB).
- The image wants booleans as `"1"`/`"0"` — the panel emits those automatically; keep that format if you add raw env settings.
- RCON shares the query port number (28016) but on TCP; only forward the UDP game + query ports and the Rust+ TCP port, never RCON.
- Backups capture only the server identity (`server/docker` saves + cfg, plus `oxide/`), skipping the multi-GB game install.
- Kick/ban actions need the 17-digit SteamID (captured from the `status` roster), not the player name.
