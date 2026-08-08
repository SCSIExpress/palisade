# BeamNG.drive (BeamMP)

**Image:** `rouhim/beammp-server:latest` (by rouhim) · **Ports (defaults):** 30814 game — ONE port, on BOTH TCP and UDP (forward both)

**Join:** Players must launch BeamNG.drive through the free BeamMP launcher, then Multiplayer → Direct Connect with `<host>:30814` (or find the server by name when it isn't set Private). Friends outside your LAN use your public IP with the same port.

**Admin:** None — no RCON or query; the server console is stdin-only, so the panel's Console tab is hidden and player counts are unavailable. The admin-password field carries the mandatory BeamMP AuthKey instead (a free key from beammp.com/k/dashboard); it is editable after creation in the server page's access card.

## First boot
The BeamMP server binary is baked into the image — nothing downloads, and the server is up in seconds (~1 GB RAM; it is a lightweight relay, physics run on the clients). The map field selects the vanilla BeamNG level (11 choices, e.g. gridmap_v2, west_coast_usa, italy), expanded to `/levels/<name>/info.json`. Ready marker: `ALL SYSTEMS STARTED SUCCESSFULLY, EVERYTHING IS OKAY` — confirmed live.

## Gotchas
- The AuthKey authenticates the SERVER, not players — it is required even for private servers. The server actually boots fully with an invalid key (only a WARN about key length), but backend auth/listing — and possibly launcher joins — need a real key.
- The rouhim image does not expose BeamMP's join password, so the join-password field is hidden — set the server Private (Settings tab) instead if you want it unlisted.
- There is no world state: the client-mod zips (`mods-client/` — maps/vehicles sent to joiners) and server-side Lua plugins (`mods-server/`) ARE the persistent data, and are what backups capture.
- `MAX_CARS` taxes the players' machines, not the server — the physics load is client-side.
- Players cannot join from a plain Steam copy of BeamNG.drive — the BeamMP launcher is required.
