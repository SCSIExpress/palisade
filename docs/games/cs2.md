# Counter-Strike 2

**Image:** `joedwards32/cs2:latest` (by joedwards32) · **Ports (defaults):** 27015 game — TCP AND UDP (A2S queries ride the same UDP port; forward both), 27020/udp CSTV/SourceTV spectator, 27025/tcp RCON (a TCP proxy inside the image via `CS2_RCON_PORT` — stays LAN-only)

**Join:** In CS2, enable the developer console (Settings → Game), press `~` and paste `connect <host>:27015`. Friends outside your LAN use your public IP with the same port. Public server-browser listing requires a GSLT token (Settings tab).

**Admin:** Standard Source RCON on its own TCP port (27025), so the panel console does not share the game port. The admin-password field sets the RCON password (`CS2_RCONPW`) and enables the in-panel console; `say`, `kickid`, and permanent `banid 0 <id>` are wired, and A2S provides player counts.

## First boot
The biggest install in the panel: the depot is ~66 GiB (Valve's README says 60 GB disk), and the first install took ~45 minutes on a real box — the startup deadline for CS2 is raised to 120 minutes to accommodate it. SteamCMD runs an install/update on EVERY start, so a restart is also an update (game-version pinning is "none" for CS2). The map field sets the start map (`CS2_STARTMAP`, 11 official maps, de_dust2 default); game type/mode presets, Workshop maps/collections, bots, CSTV, and logging live in the Settings tab. RAM sits around 2–4 GB in play. Ready marker: `Host activate: Loading` / `Connection to Steam servers successful`.

## Gotchas
- The image runs as a fixed unprivileged uid-1000 "steam" user, and Docker creates a missing bind directory ROOT-owned — without the panel's pre-chown, SteamCMD can't write the bind and silently downloads the entire ~66 GiB into the container layer (which can burst Unraid's docker.img). Palisade pre-creates and chowns the instance dir before every start.
- Budget the disk before creating the server: the panel's preflight reserves ~62 GB for the install.
- Public listing (and reliable Steam features) needs a Game Server Login Token (GSLT) from Valve, entered in the Settings tab; without it the server runs anonymously.
- Server names containing `/` must be escaped as `\/` for the image's config templating — the panel does this automatically; keep it in mind for raw env overrides.
- The image's boolean-ish flags are NUMERIC strings (0/1), not true/false — the catalog emits them correctly.
- Since SteamCMD updates on every start, a routine restart after a Valve update can take several minutes, not seconds.
