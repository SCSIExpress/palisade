import { Game, SettingTarget, type SettingsCatalog, type SettingDef } from "@ark/shared";

/**
 * Don't Starve Together catalog. The jamesits image is volume-driven: Palisade
 * renders cluster.ini fresh each start (renderDstClusterIni), so every setting
 * here is an ini key routed via emitAs = "<section>.<key>" — the OpenTTD pattern.
 * First-class fields the orchestrator owns (cluster name, password, max players,
 * Klei token via the admin field, ports) are NOT here.
 */
function dset(
  key: string,
  label: string,
  category: string,
  section: string,
  iniKey: string,
  type: SettingDef["type"],
  def: SettingDef["default"],
  extra: Partial<SettingDef> = {},
): SettingDef {
  return {
    key,
    label,
    category,
    target: SettingTarget.Env,
    emitAs: `${section}.${iniKey}`,
    type,
    default: def,
    ...extra,
  };
}

const settings: SettingDef[] = [
  // ── Gameplay ──────────────────────────────────────────────────────────────────
  dset("game_mode", "Game mode", "Gameplay", "GAMEPLAY", "game_mode", "enum", "survival", {
    choices: [
      { value: "survival", label: "Survival (world resets when everyone dies)" },
      { value: "endless", label: "Endless (respawn at the portal)" },
      { value: "wilderness", label: "Wilderness (random spawns, no world reset)" },
    ],
  }),
  dset("pvp", "PvP", "Gameplay", "GAMEPLAY", "pvp", "bool", false),
  dset("pause_when_empty", "Pause when empty", "Gameplay", "GAMEPLAY", "pause_when_empty", "bool", true, {
    help: "Freeze world time while nobody is online (recommended).",
  }),
  dset("vote_enabled", "Player votes (kick etc.)", "Gameplay", "GAMEPLAY", "vote_enabled", "bool", true),

  // ── Network / listing ─────────────────────────────────────────────────────────
  dset("cluster_description", "Server description", "Network", "NETWORK", "cluster_description", "string", "", {
    help: "Shown in the server browser.",
  }),
  dset("cluster_intention", "Playstyle tag", "Network", "NETWORK", "cluster_intention", "enum", "cooperative", {
    choices: [
      { value: "cooperative", label: "Cooperative" },
      { value: "social", label: "Social" },
      { value: "competitive", label: "Competitive" },
      { value: "madness", label: "Madness" },
    ],
    help: "The intention tag players filter by in the browser.",
  }),
  dset("lan_only_cluster", "LAN only", "Network", "NETWORK", "lan_only_cluster", "bool", false, {
    advanced: true,
  }),
  dset("offline_cluster", "Offline mode", "Network", "NETWORK", "offline_cluster", "bool", false, {
    advanced: true,
    help: "No Klei/Steam connectivity — LAN clients only, no cluster token needed in-game features reduced.",
  }),
  dset("tick_rate", "Tick rate", "Network", "NETWORK", "tick_rate", "int", 15, {
    min: 10,
    max: 60,
    advanced: true,
    help: "Server simulation/net tick. 15 is Klei's default; higher = smoother + more CPU.",
  }),
  dset("whitelist_slots", "Reserved whitelist slots", "Network", "NETWORK", "whitelist_slots", "int", 0, {
    min: 0,
    max: 64,
    advanced: true,
  }),
  dset("autosaver_enabled", "Autosave", "Network", "NETWORK", "autosaver_enabled", "bool", true, {
    advanced: true,
  }),

  // ── Misc ──────────────────────────────────────────────────────────────────────
  dset("console_enabled", "In-game console", "Misc", "MISC", "console_enabled", "bool", true, {
    advanced: true,
    help: "Allow the in-game console (admins only).",
  }),
  dset("max_snapshots", "Rollback snapshots", "Misc", "MISC", "max_snapshots", "int", 6, {
    min: 0,
    max: 30,
    advanced: true,
    help: "How many world snapshots are kept for the in-game Rollback command.",
  }),
];

export const DST_CATALOG: SettingsCatalog = { game: Game.DST, version: "1", settings };
