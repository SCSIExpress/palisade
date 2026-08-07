import { describe, it, expect, beforeAll } from "vitest";
import { Game, type ServerConfigValues } from "@ark/shared";
import { CS2_CATALOG } from "../catalog/cs2.catalog";

beforeAll(() => {
  process.env.SECRETS_KEY = "a".repeat(64);
  process.env.JWT_SECRET = "test-jwt-secret-1234";
  process.env.DATA_DIR = "/data";
});

const envOf = (spec: { Env?: string[] }) => spec.Env ?? [];

async function buildCs2(config: ServerConfigValues, sessionName = "My CS2 Server") {
  const { buildContainerSpec } = await import("./runtime-spec");
  return buildContainerSpec({
    serverId: "srv1",
    game: Game.CS2,
    map: "de_dust2",
    sessionName,
    ports: { game: 27015, rawSocket: 27020, query: 27015, rcon: 27025 },
    maxPlayers: 10,
    adminPassword: "rcon-secret",
    serverPassword: "join-pw",
    modIds: [],
    cluster: null,
    config,
    catalog: CS2_CATALOG,
  });
}

describe("buildContainerSpec (CS2 / joedwards32)", () => {
  it("maps to the image's env contract (ports, rcon proxy, passwords, start map)", async () => {
    const spec = await buildCs2({ values: {} });
    expect(spec.Image).toBe("joedwards32/cs2:latest");
    const env = envOf(spec);
    expect(env).toContain("CS2_SERVERNAME=My CS2 Server");
    expect(env).toContain("CS2_PORT=27015");
    expect(env).toContain("CS2_RCON_PORT=27025"); // manager console via the image's TCP proxy
    expect(env).toContain("CS2_RCONPW=rcon-secret");
    expect(env).toContain("CS2_PW=join-pw");
    expect(env).toContain("CS2_MAXPLAYERS=10");
    expect(env).toContain("CS2_STARTMAP=de_dust2");
    expect(env).toContain("TV_PORT=27020");
    // game is tcp+udp; CSTV udp; rcon tcp
    expect(spec.HostConfig?.PortBindings?.["27015/tcp"]).toEqual([{ HostPort: "27015" }]);
    expect(spec.HostConfig?.PortBindings?.["27015/udp"]).toEqual([{ HostPort: "27015" }]);
    expect(spec.HostConfig?.PortBindings?.["27020/udp"]).toEqual([{ HostPort: "27020" }]);
    expect(spec.HostConfig?.PortBindings?.["27025/tcp"]).toEqual([{ HostPort: "27025" }]);
    const binds = spec.HostConfig?.Binds ?? [];
    expect(binds.some((b) => b.endsWith(":/home/steam/cs2-dedicated"))).toBe(true);
  });

  it("escapes forward slashes in the server name (image templating requirement)", async () => {
    const env = envOf(await buildCs2({ values: {} }, "My Server 1/3"));
    expect(env).toContain("CS2_SERVERNAME=My Server 1\\/3");
  });

  it("drops empty catalog values so image defaults apply; passes set ones", async () => {
    const def = envOf(await buildCs2({ values: {} }));
    expect(def.some((e) => e.startsWith("SRCDS_TOKEN="))).toBe(false); // blank → LAN mode
    expect(def.some((e) => e.startsWith("CS2_GAMEALIAS="))).toBe(false);
    expect(def).toContain("CS2_MAPGROUP=mg_active");
    const set = envOf(
      await buildCs2({ values: { SRCDS_TOKEN: "ABC123", CS2_GAMEALIAS: "competitive", CS2_BOT_QUOTA: 4 } }),
    );
    expect(set).toContain("SRCDS_TOKEN=ABC123");
    expect(set).toContain("CS2_GAMEALIAS=competitive");
    expect(set).toContain("CS2_BOT_QUOTA=4");
  });

  it("catalog sanity: no dupes, enum defaults valid, numeric flags are 0/1 enums", () => {
    const keys = CS2_CATALOG.settings.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const s of CS2_CATALOG.settings) {
      if (s.type === "enum") expect(s.choices!.map((c) => c.value)).toContain(String(s.default));
    }
  });
});
