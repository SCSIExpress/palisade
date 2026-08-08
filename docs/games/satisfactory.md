# Satisfactory

**Image:** `wolveix/satisfactory-server:latest` (by wolveix) · **Ports (defaults):** 7777/udp (game traffic), 7777/tcp (HTTPS server API — players join and the panel manages through it), 8888/tcp (reliable messaging)

**Join:** In Satisfactory, open **Server Manager → Add Server** and enter the server address with port 7777. Accept the self-signed certificate when prompted. Palisade has already claimed the server with your server name and admin password, so it appears ready to join — no in-game claim step. Enter the join password if you set one.

**Admin:** No RCON — management is the game's own HTTPS API on the game port (7777/tcp, self-signed TLS). The admin password field is what Palisade uses to claim a fresh server through that API on first boot (PasswordlessLogin → ClaimServer → SetClientPassword) and it also unlocks the in-game Server Manager. Player counts come from the same API.

## First boot
SteamCMD downloads the native Linux dedicated server (app 1690800, ~3 GB download, ~10 GB on disk) into the single `/config` volume on first start. No world generation wait — the ready marker (`Engine is initialized. Leaving FEngineLoop::Init()`) fires as the game port opens, and the panel's API claim follows within seconds. No restart needed; settings are env-driven and apply on every start. Default slots are 4 (raise up to 16, but >8 needs serious hardware).

## Gotchas
- Port 7777 collides with the ARK-family block and Terraria — the start-time conflict guard prevents running them at the same time.
- The game port carries **both** UDP game traffic and the TCP HTTPS API. For remote players forward 7777 udp + 7777 tcp + 8888 tcp; all three are player-facing.
- The first in-game connection prompts about a self-signed certificate — accept it; that's the server's own API TLS.
- When a join password is set, the panel's player-count query falls back to an admin PasswordLogin — this is expected and works; counts still show.
- One `/config` volume holds gamefiles (~10 GB), saves, blueprints, and logs; panel backups target only the small `saved` directory.
- RAM grows with factory size — budget ~8 GB and expect more in the late game.
