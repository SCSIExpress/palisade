# Terraria (TShock)

**Image:** `ryshe/terraria:latest` (by ryshe — TShock 6.1 on Terraria 1.4.4.9, baked into the image) · **Ports (defaults):** 7777/tcp (game), 7979/tcp (TShock REST API — LAN-only, powers the panel's player counts)

**Join:** In Terraria, open **Multiplayer → Join via IP** and enter the server address with port 7777. Terraria has no public server browser — everyone joins by IP; remote players use your public IP with TCP 7777 forwarded. Enter the join password if one is set.

**Admin:** The admin password field doubles as the **TShock REST application token** (superadmin): the REST API is enabled exactly when it's set, and the panel reads player counts from `/v2/server/status` with it. Leave it empty to disable REST entirely. The server console is stdin-only, so the panel's console UI is hidden for this game.

## First boot
Nothing downloads — TShock is baked into the image, so the first start goes straight to world generation via `-autocreate` (world size comes from the map field: Small / Medium / Large) with the server name as the world name. Ready markers `Listening on port 7777` and `Server started` are both real, live-confirmed lines. TShock's `config.json` lives inside the worlds bind; the panel merge-patches its keys (name, password, slots, port, REST) before every start and TShock refills its own defaults around them. No restart quirks — the config applies from the first boot.

## Gotchas
- **The REST port is 7979, not TShock's 7878 default** — game containers use host networking and 7878 is Radarr's well-known port (a real crash-loop on the original box: "already have a REST service bound to port 7878"). On any media-server host, check game ports against the *arr stack.
- Port 7777 overlaps the ARK-family block and Satisfactory — the start-time conflict guard prevents running them at the same time.
- The world-size choice only applies to a **new** world; an existing `world.wld` is loaded as-is.
- TShock rewrites `config.json` with its full defaults on every boot — the panel's patcher merges rather than overwrites, so hand-edits to keys the panel doesn't own survive.
- TShock plugins can be dropped manually into the instance's `plugins` bind (`/tshock/ServerPlugins` in-container).
- Stopping the server saves the world (TShock's shutdown save is live-verified) — the world persists across stop/start.
