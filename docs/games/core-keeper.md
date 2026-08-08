# Core Keeper

**Image:** `escaping/core-keeper-dedicated:latest` (by escaping) · **Ports (defaults):** none — the server runs in the game's default Steam-relay mode, so nothing is bound, published, or forwarded

**Join:** In Core Keeper, open **Multiplayer → Join Game** and paste the secret **Game ID** shown on the server's connect card in the panel. Joins go through Steam's relay, so no IP, ports, or forwarding are needed — online or LAN. Treat the Game ID like a password: anyone who has it can join.

**Admin:** None — no RCON, no console, and no admin password field. There is also no join-password field: in relay mode the secret Game ID itself is the access gate.

## First boot
SteamCMD installs the native Linux server (app 1963720, ~680 MB — one of the smallest installs in the panel). The server writes its Game ID to `GameID.txt` late in the first boot; the panel's connect card polls the join-info endpoint until it appears, usually shortly after the ready marker (`Started session with info: <GameID>`). The world is created on first start with the mode chosen in the map field (Normal / Hard / Creative / Casual). The Game ID is stable across restarts, and can be pinned explicitly via the GAME_ID setting.

## Gotchas
- The early `failed to initialize steam.` log line on boot is a **non-fatal first try** — the retry succeeds (`Listening on SteamID` follows). Don't read it as a crash.
- No player counts: relay mode has no query protocol and no RCON, so counts stay blank in the panel.
- The **SEASON** setting must stay empty for real-date seasons — an empty value is deliberately dropped rather than sent to the server.
- The map field is repurposed as the **world mode** and only applies to a newly created world.
- Because nothing binds any ports, the ports card, port-forward helper, and server-browser help are all hidden for this game — that's by design, not a bug.
