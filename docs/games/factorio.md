# Factorio

**Image:** `factoriotools/factorio:stable` (by factoriotools) · **Ports (defaults):** 34197/udp game (forward this one only), 27015/tcp RCON (stays LAN-only)

**Join:** In Factorio, go to Multiplayer → Connect to address and paste `<host>:34197`. Friends outside your LAN use your public IP with the same port. If a game password is set, players are prompted for it on join.

**Admin:** Full Source RCON. The admin-password field sets the RCON password (written to `config/rconpw` and kept in sync by the panel), which enables the in-panel console — `/players online` powers live player counts, and kick/ban/whitelist/promote actions are wired through it. Bare text sent to the console broadcasts as chat.

## First boot
The headless server is baked into the image, so there is no SteamCMD download — the container starts and the map generates in seconds (~3 GB disk budget, ~3 GB RAM estimate on a megabase). The map field selects the map-generation preset for a NEW save (Default, rich-resources, rail-world, death-world, death-world-marathon, ribbon-world, island); once `world.zip` exists the preset is ignored and the newest (auto)save is loaded on every later boot. Ready marker: `changing state from(CreatingGame) to(InGame)`.

## Gotchas
- The map preset only applies to a brand-new save — `GENERATE_NEW_SAVE=true` no-ops once `world.zip` exists, so changing the map field later does nothing without wiping the save.
- Palisade merge-patches `server-settings.json` around your keys (the image seeds the full example file), so hand-tuned keys survive; dotted catalog keys like `visibility.public` nest one level.
- Public listing on the Factorio matchmaking server requires a factorio.com username + token (Settings tab); the same token also enables mod-portal updates via `UPDATE_MODS_ON_START`.
- `DLC_SPACE_AGE` defaults to true — turn it off if your players only own the base game.
- RCON runs on 27015/tcp, which collides with Icarus's query port, Project Zomboid's RCON, and ATS's connection port; the start-time port-conflict guard prevents running them at the same time.
- The panel issues `/server-save` before every stop so the latest state is on disk.
