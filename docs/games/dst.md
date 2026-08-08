# Don't Starve Together

**Image:** `jamesits/dst-server:latest` (by jamesits) · **Ports (defaults):** 10999/udp master (overworld) shard, 11000/udp caves shard, 12346/udp + 12347/udp Steam authentication/master — all four forwarded

**Join:** In Don't Starve Together, open the console (`~`), paste `c_connect("<host>", 10999)` and press Enter — or find the server under Browse Games by name (it lists a couple of minutes after start). Friends outside your LAN use your public IP with the same port. If a join password is set, the game (and the console command) prompt for it.

**Admin:** No RCON. The admin-password field carries the REQUIRED Klei cluster token — a free token from accounts.klei.com → Games → Don't Starve Together → Game Servers. The server refuses to start without one; the panel writes it to `cluster_token.txt` and also passes it as `DST_CLUSTER_TOKEN`.

## First boot
One container runs BOTH shards (Master overworld + Caves) under supervisord; the shards link over localhost. The image installs/updates DST via SteamCMD on every start (~1.3 GB install, ~3 GB disk budget; DST is featherweight at a few hundred MB RAM per shard). Worldgen runs on first boot; there is no map picker — worldgen comes from presets, and each shard's `worldgenoverride.lua` is seeded once (never overwritten) so you can customize it via the file manager. Ready marker: `Sim paused` / `Server registered`.

## Gotchas
- Palisade owns EVERY cluster file: the image only copies its default config when `DoNotStarveTogether/` doesn't exist, and the panel's config-writer creates it first — so that copy never runs. The panel writes `cluster.ini` (including `[SHARD] cluster_key`, without which shard mode silently disables and caves never joins), both shard `server.ini`s, and per-shard `worldgenoverride.lua`.
- The Caves shard MUST get the `DST_CAVE` preset (with `task_set = "cave_default"`) — without the seeded override it silently generates a second FOREST instead of caves.
- SteamCMD runs on every boot and occasionally hits transient Steam manifest denials (`state is 0x6`, "Access Denied"), killing the boot with exit 8. A failed update poisons that container's layer, so `docker restart` keeps failing — retry via a panel Start (fresh recreate), which recovers. The panel also auto-retries known-transient Steam failures every 10 minutes.
- If Klei's lobby backend is down at boot (503s on server listings), the caves shard's one-shot announce is dropped and the server runs caveless. Palisade surfaces this as an amber "Unhealthy" badge with a health note and performs one damped auto-restart once Klei recovers to relink the shard.
- Old saves generated under a broken shard config carry a foreign session identity — wipe `Master/save` and `Caves/save` to relink the shards.
- The game appends `id = N` to each shard's `server.ini`; the panel preserves those ids across rewrites so save/portal linkage survives. Don't strip them if editing by hand.
