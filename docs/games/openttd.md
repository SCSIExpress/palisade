# OpenTTD

**Image:** `ich777/openttdserver:latest` (by ich777) · **Ports (defaults):** 3979 game — TCP (clients) AND UDP (the UDP side also answers server-browser queries; forward both); admin protocol 3977 stays LAN-only and is not wired

**Join:** In OpenTTD, go to Multiplayer → Add Server and paste `<host>:3979`. If the server is set Public it also shows in the in-game server list by name. Enter the server password when prompted if one is set.

**Admin:** No Source RCON — administration is the in-game multiplayer console. The admin-password field sets `rcon_password` (and `admin_password`) in `secrets.cfg`, letting an admin run `rcon <password> "<command>"` from the in-game console. The image's gotty web console is deliberately disabled (`ENABLE_WEBCONSOLE=false`) to dodge host-network port-8080 conflicts.

## First boot
The image downloads OpenTTD itself on first start (about a 25 MB download — `GAME_VERSION` defaults to latest and is pinnable via the settings dropdown) and the server reaches Running in roughly 10 seconds. The world is generated, not a fixed map: the map field selects the LANDSCAPE (temperate / arctic / tropic / toyland), written to `openttd.cfg` `[game_creation] landscape`; map size, starting year, competitors etc. live in the Settings tab. OpenTTD is tiny — ~1 GB RAM even on a big map. Ready marker: `Starting dedicated server`.

## Gotchas
- Config is split across THREE files under `serverfiles/.config/openttd/` (OpenTTD 12+): `openttd.cfg` (public settings), `private.cfg` (server name), `secrets.cfg` (passwords). Palisade renders all three fresh on every start.
- That fresh render is authoritative on purpose: the ich777 image runs OpenTTD inside a detached `screen`, so `docker stop` hard-kills it and the game never persists its own config. Hand-edits to the three cfg files are overwritten each start — change settings in the panel instead.
- Saves live at `serverfiles/.local/share/openttd/save` (that is what backups target).
- No mods — the Console and Mods tabs are hidden for OpenTTD in the web UI.
- The image's first-boot download fails ("Can't download... sleep mode") if `serverfiles/` doesn't exist or isn't writable by UID 99; the panel's config-writer creates it before start, so this only bites when poking at the image by hand.
