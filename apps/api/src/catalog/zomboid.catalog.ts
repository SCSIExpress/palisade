import { Game, SettingTarget, type SettingsCatalog, type SettingDef } from "@ark/shared";

/**
 * Project Zomboid catalog — two kinds of settings (GH #17):
 *
 *  - Env settings (zset): the handful of vars the danixu86 start script reads and
 *    patches itself (sandbox preset, Steam mode, JVM heap). Emitted into the
 *    container env by zomboidCatalogEnv.
 *  - servertest.ini settings (zini, `section: "servertest"`): the game's own server
 *    INI surface. NOT env — patchZomboidServerIni upserts them into the instance's
 *    servertest.ini before each start, and ONLY the keys the user actually set:
 *    PZ merges its own defaults into the file on boot, so untouched keys keep the
 *    game's (build-appropriate) default and in-game admin edits survive. The
 *    `default` on these entries is therefore UI-display only. Key names verified
 *    against the PZ server-settings reference.
 *
 * First-class fields the orchestrator owns (server name, slots, ports, admin +
 * join passwords, Workshop mods, map) are NOT here. SandboxVars.lua (world tuning:
 * zombies, loot, XP) is a separate Lua surface — pick it via the sandbox preset,
 * tune in-game as admin.
 */
function zset(
  key: string,
  label: string,
  category: string,
  type: SettingDef["type"],
  def: SettingDef["default"],
  extra: Partial<SettingDef> = {},
): SettingDef {
  return { key, label, category, target: SettingTarget.Env, type, default: def, emitAs: key, ...extra };
}

/** A servertest.ini key (see patchZomboidServerIni). */
function zini(
  key: string,
  label: string,
  category: string,
  type: SettingDef["type"],
  def: SettingDef["default"],
  extra: Partial<SettingDef> = {},
): SettingDef {
  return {
    key,
    label,
    category,
    target: SettingTarget.Env,
    section: "servertest",
    type,
    default: def,
    emitAs: key,
    ...extra,
  };
}

const settings: SettingDef[] = [
  // ── World (env: preset) ───────────────────────────────────────────────────────
  zset("SERVERPRESET", "Sandbox preset", "World", "enum", "Apocalypse", {
    choices: [
      { value: "Apocalypse", label: "Apocalypse (default survival)" },
      { value: "Beginner", label: "Beginner" },
      { value: "Builder", label: "Builder (relaxed, base-building)" },
      { value: "FirstWeek", label: "First Week" },
      { value: "SixMonthsLater", label: "Six Months Later" },
      { value: "Survival", label: "Survival (classic)" },
      { value: "Survivor", label: "Survivor (combat-focused)" },
    ],
    help: "The sandbox ruleset the world is created with. Applies on FIRST boot only — an existing save keeps its preset unless 'Re-apply preset' is on.",
  }),
  zset("SERVERPRESETREPLACE", "Re-apply preset on start", "World", "bool", false, {
    help: "Overwrite the server's sandbox settings with the preset above on every start. Leave off to preserve custom in-game sandbox tweaks.",
  }),

  // ── World (ini) ───────────────────────────────────────────────────────────────
  zini("SpawnPoint", "Fixed spawn point", "World", "string", "0,0,0", {
    advanced: true,
    help: 'Force every new player to spawn at "x,y,z" (world coordinates). 0,0,0 uses the normal spawn-region selection.',
  }),
  zini("SpawnItems", "Starter items", "World", "string", "", {
    help: 'Comma-separated item types given to new characters, e.g. "Base.Axe,Base.Bag_BigHikingBag".',
  }),
  zini("SaveWorldEveryMinutes", "World save interval", "World", "int", 0, {
    min: 0,
    max: 120,
    unit: "min",
    help: "Save loaded map chunks this often. 0 = only save on chunk unload / shutdown.",
  }),
  zini("NoFire", "Disable fire", "World", "bool", false, {
    help: "Turn off fire spread entirely (campfires still work).",
  }),
  zini("AnnounceDeath", "Announce player deaths", "World", "bool", false, {
    help: "Broadcast a chat message when a player dies.",
  }),
  zini("AnnounceAnimalDeath", "Announce animal deaths", "World", "bool", false, {
    advanced: true,
    help: "Broadcast a chat message when a tamed animal dies (B42 animals).",
  }),
  zini("SleepAllowed", "Sleeping allowed", "World", "bool", false, {
    help: "Let players sleep in beds. Multiplayer sleep needs everyone (or a majority) sleeping.",
  }),
  zini("SleepNeeded", "Sleep needed", "World", "bool", false, {
    help: "Characters get tired and must sleep (only meaningful with sleeping allowed).",
  }),
  zini("KnockedDownAllowed", "Knockdowns allowed", "World", "bool", true, {
    advanced: true,
    help: "Allow players/zombies to be knocked to the ground in combat.",
  }),
  zini("SneakModeHideFromOtherPlayers", "Sneaking hides from players", "World", "bool", true, {
    advanced: true,
    help: "A sneaking player is hidden from other players' sight cones.",
  }),
  zini("TrashDeleteAll", "Trash cans delete items", "World", "bool", false, {
    help: "Items placed in trash cans are permanently deleted.",
  }),
  zini("RemovePlayerCorpsesOnCorpseRemoval", "Remove player corpses too", "World", "bool", false, {
    advanced: true,
    help: "When the sandbox corpse-removal timer fires, also remove player corpses.",
  }),
  zini("BloodSplatLifespanDays", "Blood splat lifespan", "World", "int", 0, {
    min: 0,
    max: 365,
    unit: "days",
    help: "Days before blood splats are cleaned up. 0 = never cleaned.",
  }),
  zini("ItemNumbersLimitPerContainer", "Max items per container", "World", "int", 0, {
    min: 0,
    max: 9000,
    advanced: true,
    help: "Cap on item stacks in a single container. 0 = unlimited.",
  }),
  zini("FastForwardMultiplier", "Fast-forward speed", "World", "float", 40, {
    min: 1,
    max: 100,
    step: 1,
    unit: "×",
    advanced: true,
    help: "Time multiplier while every player sleeps.",
  }),
  zini("UltraSpeedDoesnotAffectToAnimals", "Fast-forward skips animals", "World", "bool", false, {
    advanced: true,
    help: "Animals don't simulate at fast-forward speed (B42).",
  }),

  // ── Server & join ─────────────────────────────────────────────────────────────
  zini("Open", "Open server (no whitelist)", "Server", "bool", true, {
    help: "Anyone can join and an account is created on first login. Off = whitelist-only: only accounts you've added can join.",
  }),
  zini("DropOffWhiteListAfterDeath", "Drop whitelist on death", "Server", "bool", false, {
    advanced: true,
    help: "Remove a player's whitelist entry when their character dies (hardcore one-life servers).",
  }),
  zini("MaxAccountsPerUser", "Max accounts per user", "Server", "int", 0, {
    min: 0,
    max: 100,
    advanced: true,
    help: "Limit how many accounts a single Steam user can create. 0 = unlimited.",
  }),
  zini("AllowCoop", "Allow split-screen co-op", "Server", "bool", true, {
    advanced: true,
    help: "Let a player bring split-screen co-op players onto the server.",
  }),
  zini("PauseEmpty", "Pause when empty", "Server", "bool", true, {
    help: "Freeze world time while no players are online (recommended — stops food rot + zombie migration on an idle server).",
  }),
  zini("PublicDescription", "Server description", "Server", "string", "", {
    help: "Description shown in the public server browser. \\n for line breaks.",
  }),
  zini("ServerWelcomeMessage", "Welcome message", "Server", "string", "", {
    help: "Message shown to players in chat when they join. <RGB:1,0,0> colors and <LINE> breaks supported.",
  }),
  zini("LoginQueueEnabled", "Login queue", "Server", "bool", false, {
    advanced: true,
    help: "Queue simultaneous logins instead of letting them race.",
  }),
  zini("LoginQueueConnectTimeout", "Login queue timeout", "Server", "int", 60, {
    min: 10,
    max: 600,
    unit: "s",
    advanced: true,
  }),
  zini("DenyLoginOnOverloadedServer", "Deny login when overloaded", "Server", "bool", true, {
    advanced: true,
    help: "Refuse new logins while the server is struggling to keep up.",
  }),
  zini("PingLimit", "Ping limit", "Server", "int", 400, {
    min: 100,
    max: 2000,
    unit: "ms",
    help: "Kick players whose ping stays above this. Raise for international communities.",
  }),
  zini("DisplayUserName", "Show usernames", "Server", "bool", true, {
    help: "Show account usernames above characters.",
  }),
  zini("ShowFirstAndLastName", "Show character names", "Server", "bool", false, {
    help: "Show character first + last names instead of (or with) usernames.",
  }),
  zini("MouseOverToSeeDisplayName", "Names on mouse-over only", "Server", "bool", true, {
    advanced: true,
  }),
  zini("HideAdminsInPlayerList", "Hide admins in player list", "Server", "bool", false, {
    advanced: true,
  }),
  zini("DisableScoreboard", "Disable scoreboard", "Server", "bool", false, {
    advanced: true,
    help: "Disable the in-game player scoreboard for non-staff (B42).",
  }),
  zini("SteamScoreboard", "Steam names on scoreboard", "Server", "enum", "true", {
    choices: [
      { value: "true", label: "Everyone" },
      { value: "admin", label: "Admins only" },
      { value: "false", label: "Nobody" },
    ],
    advanced: true,
    help: "Who can see Steam names + avatars on the scoreboard.",
  }),
  zini("ShowCoordinates", "Show coordinates", "Server", "bool", true, {
    advanced: true,
    help: "Show player coordinates in the in-game map UI.",
  }),
  zini("UPnP", "UPnP port forwarding", "Server", "bool", false, {
    advanced: true,
    help: "Ask the router to open ports automatically. Leave off — the manager publishes ports explicitly.",
  }),
  zini("AllowNonAsciiUsername", "Allow non-ASCII usernames", "Server", "bool", false, {
    advanced: true,
  }),

  // ── PvP ───────────────────────────────────────────────────────────────────────
  zini("PVP", "PvP enabled", "PvP", "bool", true, {
    help: "Master switch for player-vs-player damage (with the safety system below).",
  }),
  zini("SafetySystem", "Safety system", "PvP", "bool", true, {
    help: "Players toggle their own PvP flag; two consenting flagged players can fight. Off + PvP on = everyone is always fair game.",
  }),
  zini("ShowSafety", "Show safety skull", "PvP", "bool", true, {
    help: "Show the skull icon indicating a player's PvP state.",
  }),
  zini("SafetyToggleTimer", "Safety toggle time", "PvP", "int", 2, {
    min: 0,
    max: 1000,
    unit: "s",
    advanced: true,
    help: "Seconds it takes to switch your PvP flag.",
  }),
  zini("SafetyCooldownTimer", "Safety cooldown", "PvP", "int", 3, {
    min: 0,
    max: 1000,
    unit: "min",
    advanced: true,
    help: "Cooldown before the PvP flag can be switched again.",
  }),
  zini("SafetyDisconnectDelay", "Log-out combat delay", "PvP", "int", 0, {
    min: 0,
    max: 1000,
    unit: "s",
    advanced: true,
    help: "Keep the character in the world this long after a disconnect (anti combat-logging, B42).",
  }),
  zini("PVPMeleeDamageModifier", "PvP melee damage", "PvP", "float", 30, {
    min: 0,
    max: 500,
    step: 1,
    help: "Melee damage players deal to players.",
  }),
  zini("PVPFirearmDamageModifier", "PvP firearm damage", "PvP", "float", 50, {
    min: 0,
    max: 500,
    step: 1,
    help: "Firearm damage players deal to players.",
  }),
  zini("PVPMeleeWhileHitReaction", "Melee hit reaction", "PvP", "bool", false, {
    advanced: true,
    help: "Players stagger when hit in melee PvP.",
  }),
  zini("UsePhysicsHitReaction", "Physics hit reaction", "PvP", "bool", false, {
    advanced: true,
  }),
  zini("PlayerBumpPlayer", "Players can bump players", "PvP", "bool", false, {
    advanced: true,
    help: "Running into another player can stumble them.",
  }),
  zini("HidePlayersBehindYou", "Hide players behind you", "PvP", "bool", true, {
    advanced: true,
    help: "Players outside your vision cone are hidden (stealth PvP).",
  }),
  zini("MapRemotePlayerVisibility", "Players on map", "PvP", "enum", "1", {
    choices: [
      { value: "1", label: "Hidden" },
      { value: "2", label: "Friends only" },
      { value: "3", label: "Everyone" },
    ],
    advanced: true,
    help: "Which other players are visible on the in-game map.",
  }),
  zini("PlayerRespawnWithSelf", "Respawn at death spot", "PvP", "bool", false, {
    advanced: true,
    help: "Allow respawning at the coordinates where the previous character died.",
  }),
  zini("PlayerRespawnWithOther", "Respawn at friends", "PvP", "bool", false, {
    advanced: true,
    help: "Allow respawning next to another remote player.",
  }),
  zini("SpeedLimit", "Vehicle speed limit", "PvP", "float", 70, {
    min: 10,
    max: 150,
    step: 1,
    advanced: true,
    help: "Hard cap on vehicle speed (griefing mitigation).",
  }),
  zini("CarEngineAttractionModifier", "Engine noise attraction", "PvP", "float", 0.5, {
    min: 0,
    max: 10,
    step: 0.1,
    unit: "×",
    advanced: true,
    help: "How strongly running engines attract zombies.",
  }),
  zini("PVPLogToolChat", "Log PvP to chat", "PvP", "bool", true, {
    advanced: true,
  }),
  zini("PVPLogToolFile", "Log PvP to file", "PvP", "bool", true, {
    advanced: true,
  }),
  zini("DisableVehicleTowing", "Disable vehicle towing", "PvP", "bool", false, {
    advanced: true,
  }),
  zini("DisableTrailerTowing", "Disable trailer towing", "PvP", "bool", false, {
    advanced: true,
  }),
  zini("DisableBurntTowing", "Disable towing burnt vehicles", "PvP", "bool", false, {
    advanced: true,
  }),

  // ── Safehouses & factions ─────────────────────────────────────────────────────
  zini("PlayerSafehouse", "Player safehouses", "Safehouse", "bool", false, {
    help: "Players can claim buildings as safehouses.",
  }),
  zini("AdminSafehouse", "Admin-only safehouses", "Safehouse", "bool", false, {
    advanced: true,
    help: "Only admins can assign safehouses.",
  }),
  zini("SafehouseAllowTrepass", "Allow trespassing", "Safehouse", "bool", true, {
    help: "Non-members may enter other players' safehouses.",
  }),
  zini("SafehouseAllowFire", "Fire affects safehouses", "Safehouse", "bool", true),
  zini("SafehouseAllowLoot", "Non-members can loot", "Safehouse", "bool", true),
  zini("SafehouseAllowRespawn", "Respawn in safehouse", "Safehouse", "bool", false, {
    help: "Members respawn in their safehouse after death.",
  }),
  zini("SafehouseDaySurvivedToClaim", "Days survived to claim", "Safehouse", "int", 0, {
    min: 0,
    max: 365,
    unit: "days",
  }),
  zini("SafeHouseRemovalTime", "Auto-release after offline", "Safehouse", "int", 144, {
    min: 0,
    max: 8760,
    unit: "hours",
    help: "Release a safehouse when its members haven't been online this long.",
  }),
  zini("SafehouseAllowNonResidential", "Non-residential claims", "Safehouse", "bool", false, {
    advanced: true,
    help: "Allow claiming non-residential buildings (stores, warehouses).",
  }),
  zini("SafehouseDisableDisguises", "No disguises inside", "Safehouse", "bool", false, {
    advanced: true,
    help: "Username disguises are dropped inside safehouses (B42).",
  }),
  zini("SafehousePreventsLootRespawn", "Block loot respawn inside", "Safehouse", "bool", true, {
    advanced: true,
  }),
  zini("DisableSafehouseWhenOwnerConnected", "Unprotected while owner online", "Safehouse", "bool", false, {
    advanced: true,
    help: "Safehouse protection only applies while its owner is offline.",
  }),
  zini("MaxSafezoneSize", "Max safezone size", "Safehouse", "int", 100, {
    min: 10,
    max: 1000,
    advanced: true,
  }),
  zini("AllowDestructionBySledgehammer", "Sledgehammer destruction", "Safehouse", "bool", true, {
    help: "Players can demolish world tiles with a sledgehammer.",
  }),
  zini("SledgehammerOnlyInSafehouse", "Sledgehammer only in own safehouse", "Safehouse", "bool", false, {
    advanced: true,
  }),
  zini("Faction", "Factions", "Safehouse", "bool", true, {
    help: "Players can create factions (shared chat + map markers).",
  }),
  zini("FactionDaySurvivedToCreate", "Days survived to create faction", "Safehouse", "int", 0, {
    min: 0,
    max: 365,
    unit: "days",
    advanced: true,
  }),
  zini("FactionPlayersRequiredForTag", "Members needed for faction tag", "Safehouse", "int", 1, {
    min: 1,
    max: 100,
    advanced: true,
  }),
  zini("War", "Faction wars", "Safehouse", "bool", false, {
    advanced: true,
    help: "Enable declared faction wars, making enemy safehouses raidable (B42).",
  }),
  zini("WarStartDelay", "War start delay", "Safehouse", "int", 24, {
    min: 0,
    max: 720,
    unit: "hours",
    advanced: true,
  }),
  zini("WarDuration", "War duration", "Safehouse", "int", 48, {
    min: 1,
    max: 720,
    unit: "hours",
    advanced: true,
  }),
  zini("WarSafehouseHitPoints", "War safehouse hit points", "Safehouse", "int", 100, {
    min: 1,
    max: 10000,
    advanced: true,
  }),

  // ── Chat & voice ──────────────────────────────────────────────────────────────
  zini("GlobalChat", "Global chat", "Chat & Voice", "bool", true, {
    help: "The /all global chat channel.",
  }),
  zini("ChatStreams", "Enabled chat streams", "Chat & Voice", "string", "s,r,a,w,y,sh,f,all", {
    advanced: true,
    help: "Comma list: s=say r=shout a=admin w=whisper y=yell sh=safehouse f=faction all=global.",
  }),
  zini("ChatMessageCharacterLimit", "Chat message length limit", "Chat & Voice", "int", 256, {
    min: 1,
    max: 1024,
    advanced: true,
  }),
  zini("ChatMessageSlowModeTime", "Chat slow mode", "Chat & Voice", "int", 0, {
    min: 0,
    max: 300,
    unit: "s",
    advanced: true,
    help: "Minimum seconds between chat messages per player. 0 = off (B42).",
  }),
  zini("BanKickGlobalSound", "Ban/kick global sound", "Chat & Voice", "bool", true, {
    advanced: true,
  }),
  zini("VoiceEnable", "Voice chat", "Chat & Voice", "bool", true),
  zini("Voice3D", "3D positional voice", "Chat & Voice", "bool", true, {
    advanced: true,
  }),
  zini("VoiceMinDistance", "Voice min distance", "Chat & Voice", "float", 10, {
    min: 0,
    max: 100,
    step: 1,
    advanced: true,
  }),
  zini("VoiceMaxDistance", "Voice max distance", "Chat & Voice", "float", 100, {
    min: 10,
    max: 300,
    step: 1,
    advanced: true,
  }),
  zini("BadWordPolicy", "Bad-word policy", "Chat & Voice", "enum", "0", {
    choices: [
      { value: "0", label: "Off" },
      { value: "1", label: "Replace words" },
      { value: "2", label: "Block message" },
    ],
    advanced: true,
    help: "Chat filtering against the server's bad-word list (B42).",
  }),
  zini("BadWordReplacement", "Bad-word replacement", "Chat & Voice", "string", "****", {
    advanced: true,
  }),
  zini("DisableRadioStaff", "No radio: staff", "Chat & Voice", "bool", false, {
    advanced: true,
    help: "Hide radio transmissions from staff roles (this + the ones below control whose speech goes out over in-game radio).",
  }),
  zini("DisableRadioAdmin", "No radio: admin", "Chat & Voice", "bool", true, { advanced: true }),
  zini("DisableRadioGM", "No radio: GM", "Chat & Voice", "bool", true, { advanced: true }),
  zini("DisableRadioOverseer", "No radio: overseer", "Chat & Voice", "bool", false, { advanced: true }),
  zini("DisableRadioModerator", "No radio: moderator", "Chat & Voice", "bool", false, { advanced: true }),
  zini("DisableRadioInvisible", "No radio: invisible staff", "Chat & Voice", "bool", true, { advanced: true }),

  // ── Discord ───────────────────────────────────────────────────────────────────
  zini("DiscordEnable", "Discord bridge", "Discord", "bool", false, {
    help: "Bridge in-game chat to a Discord channel via the bot token below. (Separate from Palisade's own Discord notifications.)",
  }),
  zini("DiscordToken", "Discord bot token", "Discord", "string", "", {
    advanced: true,
    help: "Bot token for the chat bridge. Stored in the server settings and visible to panel users — use a dedicated bot with minimal permissions.",
  }),
  zini("DiscordChatChannel", "Discord chat channel", "Discord", "string", "", {
    advanced: true,
    help: "Channel name (without #) the game chat mirrors to.",
  }),
  zini("DiscordCommandChannel", "Discord command channel", "Discord", "string", "", {
    advanced: true,
  }),
  zini("DiscordLogChannel", "Discord log channel", "Discord", "string", "", {
    advanced: true,
    help: "Channel for server log events (B42).",
  }),
  zini("WebhookAddress", "Webhook address", "Discord", "string", "", {
    advanced: true,
    help: "HTTP webhook for server events (B42).",
  }),

  // ── Backups (the game's own) ──────────────────────────────────────────────────
  zini("BackupsCount", "Game backup slots", "Game backups", "int", 5, {
    min: 1,
    max: 300,
    help: "How many of PZ's own world backups to keep (separate from Palisade's backup system).",
  }),
  zini("BackupsOnStart", "Backup on start", "Game backups", "bool", true),
  zini("BackupsOnVersionChange", "Backup on version change", "Game backups", "bool", true),
  zini("BackupsPeriod", "Periodic backup interval", "Game backups", "int", 0, {
    min: 0,
    max: 1500,
    unit: "min",
    help: "0 = no periodic backups (start/version-change backups still apply).",
  }),

  // ── Anti-cheat & logs ─────────────────────────────────────────────────────────
  zini("DoLuaChecksum", "Lua checksum check", "Anti-cheat", "bool", true, {
    help: "Kick clients whose Lua scripts don't match the server's (blocks client-side script cheats; turn off only for mismatched-mod debugging).",
  }),
  zini("KickFastPlayers", "Kick speeding players", "Anti-cheat", "bool", false, {
    advanced: true,
    help: "Kick players moving impossibly fast. Can false-positive on laggy connections.",
  }),
  zini("AntiCheatProtectionType1", "Anti-cheat: type 1 (player)", "Anti-cheat", "bool", true, { advanced: true }),
  zini("AntiCheatProtectionType2", "Anti-cheat: type 2 (safety)", "Anti-cheat", "bool", true, { advanced: true }),
  zini("AntiCheatProtectionType3", "Anti-cheat: type 3 (checksum)", "Anti-cheat", "bool", true, { advanced: true }),
  zini("AntiCheatProtectionType4", "Anti-cheat: type 4 (safehouse)", "Anti-cheat", "bool", true, { advanced: true }),
  zini("AntiCheatProtectionType5", "Anti-cheat: type 5 (speed)", "Anti-cheat", "bool", true, { advanced: true }),
  zini("AntiCheatProtectionType6", "Anti-cheat: type 6 (XP)", "Anti-cheat", "bool", true, { advanced: true }),
  zini("AntiCheatProtectionType7", "Anti-cheat: type 7 (hit)", "Anti-cheat", "bool", true, { advanced: true }),
  zini("AntiCheatProtectionType8", "Anti-cheat: type 8 (noclip)", "Anti-cheat", "bool", true, { advanced: true }),
  zini(
    "ClientCommandFilter",
    "Client command log filter",
    "Anti-cheat",
    "string",
    "-vehicle.*;+vehicle.damageWindow;+vehicle.fixPart;+vehicle.installPart;+vehicle.uninstallPart",
    {
      advanced: true,
      help: "Which client commands are written to the cmd log (-exclude, +include patterns).",
    },
  ),
  zini("ClientActionLogs", "Logged client actions", "Anti-cheat", "string", "ISEnterVehicle;ISExitVehicle;ISTakeEngineParts;", {
    advanced: true,
  }),
  zini("PerkLogs", "Perk logs", "Anti-cheat", "bool", true, {
    advanced: true,
    help: "Log players' perk/level changes (useful evidence against XP cheats).",
  }),
  zini("MaxPacketsPerSecond", "Max packets/second", "Anti-cheat", "int", 0, {
    min: 0,
    max: 1000,
    advanced: true,
    help: "Per-connection packet rate cap. 0 = image/game default.",
  }),
  zini("MultiplayerStatisticsPeriod", "Statistics period", "Anti-cheat", "int", 0, {
    min: 0,
    max: 3600,
    unit: "s",
    advanced: true,
  }),
  zini("UsernameDisguises", "Username disguises", "Anti-cheat", "bool", false, {
    advanced: true,
    help: "Let players hide their username behind a disguise (B42 role-play servers).",
  }),
  zini("HideDisguisedUserName", "Hide disguised usernames", "Anti-cheat", "bool", false, {
    advanced: true,
  }),

  // ── Network / visibility (env) ────────────────────────────────────────────────
  zset("PUBLIC", "Public server list", "Network", "bool", false, {
    help: "Advertise the server on the in-game public server browser. LAN/direct-connect players can join either way.",
  }),
  zset("STEAMVAC", "Steam VAC", "Network", "bool", true, {
    help: "Valve Anti-Cheat protection for the server.",
  }),
  zset("NOSTEAM", "Allow non-Steam clients", "Network", "bool", false, {
    help: "Run in non-Steam mode so non-Steam copies can join. Disables Workshop mod auto-download for clients.",
  }),

  // ── Performance (env) ─────────────────────────────────────────────────────────
  zset("MEMORY", "Java heap size", "Performance", "string", "4096m", {
    help: "JVM max heap (e.g. 2048m, 4096m, 8g). Raise for many players/mods; keep below the container RAM limit.",
  }),
];

export const ZOMBOID_CATALOG: SettingsCatalog = { game: Game.ZOMBOID, version: "2", settings };
