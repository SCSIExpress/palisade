import { describe, it, expect, beforeAll } from "vitest";
import { Game, type ServerConfigValues } from "@ark/shared";
import { ZOMBOID_CATALOG } from "../catalog/zomboid.catalog";

beforeAll(() => {
  process.env.SECRETS_KEY = "a".repeat(64);
  process.env.JWT_SECRET = "test-jwt-secret-1234";
  process.env.DATA_DIR = "/data";
});

/** A slice of a PZ-generated servertest.ini (PZ writes the full file on boot). */
const SAMPLE_INI = [
  "PVP=true",
  "PauseEmpty=true",
  "GlobalChat=true",
  "Open=true",
  "MaxPlayers=16",
  "PingLimit=400",
  "Mods=",
  "WorkshopItems=",
  "",
].join("\n");

const patch = async (ini: string, values: Record<string, unknown>) => {
  const { patchZomboidServerIni } = await import("./runtime-spec");
  return patchZomboidServerIni(ini, {
    catalog: ZOMBOID_CATALOG,
    config: { values } as ServerConfigValues,
  });
};

describe("patchZomboidServerIni (GH #17)", () => {
  it("writes ONLY user-set keys — untouched keys keep PZ's own values", async () => {
    const out = await patch(SAMPLE_INI, { PVP: false });
    expect(out).toMatch(/^PVP=false$/m);
    // Untouched keys are untouched, even though the catalog has entries for them
    // with different defaults — defaults are UI-display only.
    expect(out).toMatch(/^PauseEmpty=true$/m);
    expect(out).toMatch(/^GlobalChat=true$/m);
    expect(out).toMatch(/^PingLimit=400$/m);
  });

  it("upserts a key the file doesn't have yet", async () => {
    const out = await patch(SAMPLE_INI, { SaveWorldEveryMinutes: 30 });
    expect(out).toMatch(/^SaveWorldEveryMinutes=30$/m);
    expect(out).toMatch(/^MaxPlayers=16$/m); // rest preserved
  });

  it("never touches orchestrator-owned or unknown lines", async () => {
    const out = await patch(SAMPLE_INI, { PVP: false, GlobalChat: false });
    expect(out).toMatch(/^MaxPlayers=16$/m);
    expect(out).toMatch(/^Mods=$/m);
    expect(out).toMatch(/^WorkshopItems=$/m);
  });

  it("booleans emit as true/false; newlines are stripped from strings", async () => {
    const out = await patch(SAMPLE_INI, {
      SleepAllowed: true,
      ServerWelcomeMessage: "hello\nworld",
    });
    expect(out).toMatch(/^SleepAllowed=true$/m);
    expect(out).toMatch(/^ServerWelcomeMessage=hello world$/m);
  });

  it("env-only settings (SERVERPRESET, MEMORY) never land in the ini", async () => {
    const out = await patch(SAMPLE_INI, { SERVERPRESET: "Builder", MEMORY: "8g" });
    expect(out).not.toMatch(/SERVERPRESET/);
    expect(out).not.toMatch(/MEMORY/);
  });
});

describe("Zomboid container env (GH #17)", () => {
  it("ini-section settings never leak into the container env", async () => {
    const { buildContainerSpec } = await import("./runtime-spec");
    const spec = buildContainerSpec({
      serverId: "srv1",
      game: Game.ZOMBOID,
      map: "Muldraugh, KY",
      sessionName: "PZ",
      ports: { game: 16261, rawSocket: 16262, query: 16261, rcon: 27015 },
      maxPlayers: 16,
      adminPassword: "secret",
      serverPassword: "",
      modIds: [],
      cluster: null,
      config: { values: { PVP: false, MEMORY: "8g", SaveWorldEveryMinutes: 30 } } as ServerConfigValues,
      catalog: ZOMBOID_CATALOG,
    });
    const env = spec.Env ?? [];
    expect(env).toContain("MEMORY=8g"); // real env setting still flows
    expect(env.some((e) => e.startsWith("PVP="))).toBe(false);
    expect(env.some((e) => e.startsWith("SaveWorldEveryMinutes="))).toBe(false);
  });
});

describe("ZOMBOID_CATALOG sanity", () => {
  it("no duplicate keys; ini entries all carry section servertest; enum defaults valid", () => {
    const keys = ZOMBOID_CATALOG.settings.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const s of ZOMBOID_CATALOG.settings) {
      if (s.section) expect(["servertest", "sandbox"]).toContain(s.section);
      if (s.type === "enum") {
        expect(s.choices!.map((c) => c.value)).toContain(String(s.default));
      }
      if (typeof s.default === "number") {
        if (s.min !== undefined) expect(s.default).toBeGreaterThanOrEqual(s.min);
        if (s.max !== undefined) expect(s.default).toBeLessThanOrEqual(s.max);
      }
    }
    // The issue's complaint: "only a small handful of settings". Keep it fixed.
    expect(ZOMBOID_CATALOG.settings.length).toBeGreaterThanOrEqual(100);
  });

  it("never exposes orchestrator-owned ini keys", () => {
    const owned = ["PublicName", "Password", "RCONPort", "RCONPassword", "MaxPlayers", "Mods", "WorkshopItems", "DefaultPort", "UDPPort", "Map"];
    const keys = new Set(ZOMBOID_CATALOG.settings.map((s) => s.key));
    for (const k of owned) expect(keys.has(k), k).toBe(false);
  });
});

describe("patchZomboidSandboxVars (SandboxVars.lua world tuning)", () => {
  const canonical = async () => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    // vitest runs with cwd = apps/api
    return readFile(join(process.cwd(), "src/servers/__fixtures__/sandboxvars-canonical.lua"), "utf8");
  };
  const patch = async (lua: string, values: Record<string, unknown>) => {
    const { patchZomboidSandboxVars } = await import("./runtime-spec");
    return patchZomboidSandboxVars(lua, {
      catalog: ZOMBOID_CATALOG,
      config: { values } as ServerConfigValues,
    });
  };

  it("every sandbox catalog key exists in a real generated SandboxVars.lua", async () => {
    const lua = await canonical();
    for (const s of ZOMBOID_CATALOG.settings) {
      if (s.section !== "sandbox") continue;
      const path = (s.emitAs ?? s.key).split(".");
      const key = path[path.length - 1]!;
      expect(new RegExp(`^\\s*${key} = `, "m").test(lua), `${s.key} → ${key}`).toBe(true);
    }
  });

  it("patches a top-level key in place, preserving everything else", async () => {
    const lua = await canonical();
    const out = await patch(lua, { XpMultiplier: 3 });
    expect(out).toMatch(/^    XpMultiplier = 3,$/m);
    expect(out).toMatch(/^    Zombies = 4,$/m); // untouched
    expect(out.split("\n").length).toBe(lua.split("\n").length); // no structural drift
  });

  it("patches keys nested in ZombieLore / ZombieConfig / Map", async () => {
    const lua = await canonical();
    const out = await patch(lua, {
      "ZombieLore.Speed": "3",
      "ZombieConfig.PopulationMultiplier": 2.5,
      "Map.AllowMiniMap": true,
    });
    expect(out).toMatch(/^\s+Speed = 3,$/m);
    expect(out).toMatch(/^\s+PopulationMultiplier = 2\.5,$/m);
    expect(out).toMatch(/^\s+AllowMiniMap = true,$/m);
    // sibling nested keys untouched
    expect(out).toMatch(/^\s+Strength = 2,$/m);
    expect(out).toMatch(/^\s+RespawnHours = 72\.0,$/m);
  });

  it("does not confuse prefix keys (Zombies vs ZombiesDragDown)", async () => {
    const lua = await canonical();
    const out = await patch(lua, { Zombies: "6" });
    expect(out).toMatch(/^    Zombies = 6,$/m);
    expect(out).toMatch(/^\s+ZombiesDragDown = true,$/m); // untouched
  });

  it("writes only user-set keys — an empty config is a no-op", async () => {
    const lua = await canonical();
    expect(await patch(lua, {})).toBe(lua);
  });

  it("booleans and enum numbers emit as Lua values (no quotes)", async () => {
    const lua = await canonical();
    const out = await patch(lua, { FireSpread: false, FoodLoot: "7" });
    expect(out).toMatch(/^    FireSpread = false,$/m);
    expect(out).toMatch(/^    FoodLoot = 7,$/m);
  });

  it("sandbox settings never leak into the container env", async () => {
    const { buildContainerSpec } = await import("./runtime-spec");
    const spec = buildContainerSpec({
      serverId: "srv1",
      game: Game.ZOMBOID,
      map: "Muldraugh, KY",
      sessionName: "PZ",
      ports: { game: 16261, rawSocket: 16262, query: 16261, rcon: 27015 },
      maxPlayers: 16,
      adminPassword: "secret",
      serverPassword: "",
      modIds: [],
      cluster: null,
      config: { values: { XpMultiplier: 3, "ZombieLore.Speed": "3" } } as ServerConfigValues,
      catalog: ZOMBOID_CATALOG,
    });
    const env = spec.Env ?? [];
    expect(env.some((e) => e.includes("XpMultiplier"))).toBe(false);
    expect(env.some((e) => e.includes("ZombieLore"))).toBe(false);
  });
});

describe("default-seeded configJson does not stomp game values (live-caught regression)", () => {
  // create() seeds configJson with EVERY catalog default — presence must not count
  // as "user-set" or catalog defaults overwrite preset/in-game values on restart.
  const allDefaults = (): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const s of ZOMBOID_CATALOG.settings) out[s.key] = s.default;
    return out;
  };

  it("SandboxVars: a config of pure defaults is a NO-OP", async () => {
    const { patchZomboidSandboxVars } = await import("./runtime-spec");
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const lua = await readFile(join(process.cwd(), "src/servers/__fixtures__/sandboxvars-canonical.lua"), "utf8");
    const out = patchZomboidSandboxVars(lua, {
      catalog: ZOMBOID_CATALOG,
      config: { values: allDefaults() } as ServerConfigValues,
    });
    expect(out).toBe(lua); // CannedFoodLoot=2, MultiHitZombies=true etc. all preserved
  });

  it("SandboxVars: defaults plus ONE real choice writes exactly that choice", async () => {
    const { patchZomboidSandboxVars } = await import("./runtime-spec");
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const lua = await readFile(join(process.cwd(), "src/servers/__fixtures__/sandboxvars-canonical.lua"), "utf8");
    const out = patchZomboidSandboxVars(lua, {
      catalog: ZOMBOID_CATALOG,
      config: { values: { ...allDefaults(), XpMultiplier: 5 } } as ServerConfigValues,
    });
    expect(out).toMatch(/^    XpMultiplier = 5,$/m);
    expect(out).toMatch(/^    CannedFoodLoot = 2,$/m); // canonical value survives
    expect(out).toMatch(/^    MultiHitZombies = true,$/m);
  });

  it("servertest.ini: a config of pure defaults is a NO-OP too", async () => {
    const { patchZomboidServerIni } = await import("./runtime-spec");
    const out = patchZomboidServerIni(SAMPLE_INI, {
      catalog: ZOMBOID_CATALOG,
      config: { values: allDefaults() } as ServerConfigValues,
    });
    expect(out).toBe(SAMPLE_INI); // PVP=true, PauseEmpty=true etc. preserved
  });
});
