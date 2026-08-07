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
      if (s.section) expect(s.section).toBe("servertest");
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
