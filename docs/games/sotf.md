# Sons of the Forest

**Image:** `jammsen/sons-of-the-forest-dedicated-server` (by jammsen; Windows server under Wine) · **Ports (defaults):** 8766/udp (game), 27016/udp (Steam query / server browser), 9700/udp (blob sync)

**Join:** In Sons of the Forest: Multiplayer → Join → Dedicated — filter or search the server list by name. There is no direct-connect field, so the server must be reachable (LAN, or all three UDP ports forwarded online). Enter the join password when prompted.

**Admin:** None — no RCON and no console (the Console tab is hidden); the admin password field is hidden too. Server admins are managed via the game's ownerswhitelist file.

## First boot
The image installs the game via SteamCMD on the first start (~3.4 GB download, ~10 GB install dir) — and unlike some images it has built-in retry, so the occasional SteamCMD "Missing configuration" flake self-heals. The server is Running at the log line `#DSL Dedicated server loaded.` (the earlier "Starting server..." fires ~2 minutes before, mid world-load). The repurposed map field sets the GameMode the save is created with (Normal/Hard/Peaceful/Creative); a new save is created at Slot 1 on first boot, then `SaveMode=Continue` resumes it. Player cap is 8 (Endnight's design cap).

## Gotchas
- All settings live in `userdata/dedicatedserver.cfg` (JSON), rendered by Palisade before every start — hand edits are clobbered; use the panel. The image logs "Setting server-name to jammsen-docker-generated-..." unconditionally, but it only seeds its example config when the file is missing; the rendered config is honored, including on the very first boot.
- The docker healthcheck shows `(unhealthy)` during the install phase — cosmetic, ignore it.
- Game logs use `#DSL`/`#DSW` prefixes; a UnityException about 2D array textures during boot is non-fatal (headless server).
- The game port 8766 collides with Project Zomboid's fixed Steam comms port — the start-time conflict guard prevents running both at once.
- This is a heavy game under Wine: budget around 12 GB RAM (jammsen recommends 8-16 GB).
