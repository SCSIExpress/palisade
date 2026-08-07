import { Game, SettingTarget, type SettingsCatalog, type SettingDef } from "@ark/shared";

/**
 * Counter-Strike 2 catalog. The joedwards32/cs2 image is env-driven (CS2_* / TV_*),
 * so every setting targets `Env` and buildCs2Spec passes it through (key = env var
 * name). The image's flags are NUMERIC (0/1), so toggles here are 0/1 enums.
 * First-class fields the orchestrator owns (server name, passwords, max players,
 * ports, start map) are NOT here.
 */
function cset(
  key: string,
  label: string,
  category: string,
  type: SettingDef["type"],
  def: SettingDef["default"],
  extra: Partial<SettingDef> = {},
): SettingDef {
  return { key, label, category, target: SettingTarget.Env, type, default: def, emitAs: key, ...extra };
}

const onOff = (on = "On", off = "Off") => [
  { value: "0", label: off },
  { value: "1", label: on },
];

const settings: SettingDef[] = [
  // ── Server ───────────────────────────────────────────────────────────────────
  cset("SRCDS_TOKEN", "Game Server Login Token (GSLT)", "Server", "string", "", {
    help: "Free token from steamcommunity.com/dev/managegameservers (app 730). Required for the server to be publicly listed / reachable outside LAN. Leave blank for LAN-only.",
  }),
  cset("CS2_GAMEALIAS", "Game mode", "Server", "enum", "", {
    choices: [
      { value: "", label: "Custom (use type/mode below)" },
      { value: "casual", label: "Casual" },
      { value: "competitive", label: "Competitive" },
      { value: "wingman", label: "Wingman" },
      { value: "deathmatch", label: "Deathmatch" },
    ],
    help: "Preset game mode. Custom uses the raw game type/mode numbers below.",
  }),
  cset("CS2_GAMETYPE", "Game type (raw)", "Server", "int", 0, {
    min: 0,
    max: 3,
    advanced: true,
    help: "Only used when Game mode is Custom. See Valve's Counter-Strike 2 dedicated-server docs.",
  }),
  cset("CS2_GAMEMODE", "Game mode (raw)", "Server", "int", 1, {
    min: 0,
    max: 2,
    advanced: true,
    help: "Only used when Game mode is Custom.",
  }),
  cset("CS2_MAPGROUP", "Map group", "Server", "string", "mg_active", {
    help: "The map pool the server rotates through (e.g. mg_active). Ignored when a Workshop map is set.",
  }),
  cset("CS2_LAN", "LAN mode", "Server", "enum", "0", {
    choices: onOff("LAN only", "Internet"),
    advanced: true,
  }),
  cset("CS2_CHEATS", "Allow cheats (sv_cheats)", "Server", "enum", "0", { choices: onOff(), advanced: true }),
  cset("CS2_SERVER_HIBERNATE", "Hibernate when empty", "Server", "enum", "0", {
    choices: onOff(),
    advanced: true,
    help: "Low-CPU state with no players. The image notes hibernation has been observed to trigger crashes — off by default.",
  }),
  cset("CS2_ADDITIONAL_ARGS", "Additional launch args", "Server", "string", "", {
    advanced: true,
    help: "Extra arguments appended to the cs2 launch command.",
  }),
  cset("STEAMAPPVALIDATE", "Validate game files on start", "Server", "enum", "0", {
    choices: onOff(),
    advanced: true,
    help: "Makes SteamCMD validate + redownload broken files on the next start (slower).",
  }),
  cset("CS2_CFG_URL", "Config bundle URL", "Server", "string", "", {
    advanced: true,
    help: "HTTP(S) URL of a tar.gz/zip of config files/mods the image fetches and extracts over the server files on start.",
  }),

  // ── Workshop ─────────────────────────────────────────────────────────────────
  cset("CS2_HOST_WORKSHOP_MAP", "Workshop map ID", "Workshop", "string", "", {
    help: "Steam Workshop map ID to load on start (overrides the start map + map group).",
  }),
  cset("CS2_HOST_WORKSHOP_COLLECTION", "Workshop collection ID", "Workshop", "string", "", {
    help: "Steam Workshop collection ID to download.",
  }),

  // ── Bots ─────────────────────────────────────────────────────────────────────
  cset("CS2_BOT_QUOTA", "Bot count", "Bots", "int", 0, {
    min: 0,
    max: 30,
    help: "Number of bots. 0 = none.",
  }),
  cset("CS2_BOT_DIFFICULTY", "Bot difficulty", "Bots", "enum", "", {
    choices: [
      { value: "", label: "Default" },
      { value: "0", label: "Easy" },
      { value: "1", label: "Normal" },
      { value: "2", label: "Hard" },
      { value: "3", label: "Expert" },
    ],
  }),
  cset("CS2_BOT_QUOTA_MODE", "Bot quota mode", "Bots", "enum", "", {
    choices: [
      { value: "", label: "Default" },
      { value: "fill", label: "Fill (top up to the quota)" },
      { value: "competitive", label: "Competitive" },
    ],
    advanced: true,
  }),

  // ── CSTV ─────────────────────────────────────────────────────────────────────
  cset("TV_ENABLE", "CSTV spectator relay", "CSTV", "enum", "0", {
    choices: onOff(),
    help: "SourceTV/CSTV broadcast on the CSTV port (spectators + demo recording).",
  }),
  cset("TV_AUTORECORD", "Auto-record demos", "CSTV", "enum", "0", { choices: onOff(), advanced: true }),
  cset("TV_PW", "CSTV password", "CSTV", "string", "changeme", { advanced: true }),
  cset("TV_RELAY_PW", "CSTV relay password", "CSTV", "string", "changeme", { advanced: true }),
  cset("TV_MAXRATE", "CSTV max rate", "CSTV", "int", 0, { min: 0, max: 1000000, advanced: true }),
  cset("TV_DELAY", "CSTV broadcast delay", "CSTV", "int", 0, { min: 0, max: 900, unit: "s", advanced: true }),

  // ── Logging ──────────────────────────────────────────────────────────────────
  cset("CS2_LOG", "Server logging", "Logging", "enum", "on", {
    choices: [
      { value: "on", label: "On" },
      { value: "off", label: "Off" },
    ],
    advanced: true,
  }),
  cset("CS2_LOG_MONEY", "Log money", "Logging", "enum", "0", { choices: onOff(), advanced: true }),
  cset("CS2_LOG_DETAIL", "Combat damage logging", "Logging", "enum", "0", {
    advanced: true,
    choices: [
      { value: "0", label: "Off" },
      { value: "1", label: "Enemy" },
      { value: "2", label: "Friendly" },
      { value: "3", label: "All" },
    ],
  }),
  cset("CS2_LOG_ITEMS", "Log items", "Logging", "enum", "0", { choices: onOff(), advanced: true }),
  cset("CS2_LOG_FILE", "Log to file", "Logging", "enum", "0", { choices: onOff(), advanced: true }),
];

export const CS2_CATALOG: SettingsCatalog = { game: Game.CS2, version: "1", settings };
