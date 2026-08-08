import { describe, it, expect, beforeAll } from "vitest";
import { Game, type ServerConfigValues } from "@ark/shared";
import { DST_CATALOG } from "../catalog/dst.catalog";

beforeAll(() => {
  process.env.SECRETS_KEY = "a".repeat(64);
  process.env.JWT_SECRET = "test-jwt-secret-1234";
  process.env.DATA_DIR = "/data";
});

async function buildDst() {
  const { buildContainerSpec } = await import("./runtime-spec");
  return buildContainerSpec({
    serverId: "srv1",
    game: Game.DST,
    map: "Together",
    sessionName: "Constant Chaos",
    ports: { game: 10999, rawSocket: 11000, query: 12346, rcon: 0 },
    maxPlayers: 6,
    adminPassword: "pds-g^token^example=",
    serverPassword: "friends",
    modIds: [],
    cluster: null,
    config: { values: {} } as ServerConfigValues,
    catalog: DST_CATALOG,
  });
}

describe("buildContainerSpec (DST / jamesits)", () => {
  it("binds the cluster volume, exposes the four UDP ports, passes the token", async () => {
    const spec = await buildDst();
    expect(spec.Image).toBe("jamesits/dst-server:latest");
    const env = spec.Env ?? [];
    expect(env).toContain("DST_SERVER_ARCH=amd64");
    expect(env).toContain("DST_CLUSTER_TOKEN=pds-g^token^example=");
    for (const p of ["10999/udp", "11000/udp", "12346/udp", "12347/udp"]) {
      expect(spec.HostConfig?.PortBindings?.[p], p).toBeTruthy();
    }
    expect(spec.HostConfig?.PortBindings?.["10999/tcp"]).toBeUndefined();
    const binds = spec.HostConfig?.Binds ?? [];
    expect(binds.some((b) => b.endsWith(":/data"))).toBe(true);
  });
});

describe("renderDstClusterIni", () => {
  const render = async (values: Record<string, unknown> = {}, pw = "friends") => {
    const { renderDstClusterIni } = await import("./runtime-spec");
    return renderDstClusterIni({
      sessionName: "Constant Chaos",
      serverPassword: pw,
      maxPlayers: 6,
      gamePort: 10999,
      catalog: DST_CATALOG,
      config: { values } as ServerConfigValues,
    });
  };

  it("renders orchestrator fields + catalog defaults into the right sections", async () => {
    const ini = await render();
    expect(ini).toMatch(/^\[GAMEPLAY\]$/m);
    expect(ini).toMatch(/^max_players = 6$/m);
    expect(ini).toMatch(/^game_mode = survival$/m);
    expect(ini).toMatch(/^pause_when_empty = true$/m);
    expect(ini).toMatch(/^cluster_name = Constant Chaos$/m);
    expect(ini).toMatch(/^cluster_password = friends$/m);
    expect(ini).toMatch(/^cluster_intention = cooperative$/m);
    expect(ini).toMatch(/^shard_enabled = true$/m); // caves shard wiring
  });

  it("honours user settings and omits an empty password", async () => {
    const ini = await render({ game_mode: "endless", pvp: true, tick_rate: 30 }, "");
    expect(ini).toMatch(/^game_mode = endless$/m);
    expect(ini).toMatch(/^pvp = true$/m);
    expect(ini).toMatch(/^tick_rate = 30$/m);
    expect(ini).not.toMatch(/cluster_password/);
  });

  it("strips newline injection from free text", async () => {
    const { renderDstClusterIni } = await import("./runtime-spec");
    const ini = renderDstClusterIni({
      sessionName: "evil\n[SHARD]\nmaster_ip = 8.8.8.8",
      serverPassword: "",
      maxPlayers: 6,
      gamePort: 10999,
      catalog: DST_CATALOG,
      config: { values: {} } as ServerConfigValues,
    });
    expect(ini).toMatch(/^cluster_name = evil \[SHARD\] master_ip = 8\.8\.8\.8$/m);
  });
});

describe("renderDstShardInis", () => {
  it("writes master/caves shard configs wired to the port block", async () => {
    const { renderDstShardInis } = await import("./runtime-spec");
    const { master, caves } = renderDstShardInis({ game: 10999, rawSocket: 11000, query: 12346 });
    expect(master).toMatch(/^is_master = true$/m);
    expect(master).toMatch(/^server_port = 10999$/m);
    expect(master).toMatch(/^master_server_port = 12346$/m);
    expect(master).toMatch(/^authentication_port = 8766$/m);
    expect(caves).toMatch(/^is_master = false$/m);
    expect(caves).toMatch(/^name = Caves$/m);
    expect(caves).toMatch(/^server_port = 11000$/m);
    expect(caves).toMatch(/^master_server_port = 12347$/m);
    expect(caves).toMatch(/^authentication_port = 8767$/m);
    expect(master).toMatch(/^encode_user_path = true$/m);
    expect(caves).toMatch(/^encode_user_path = true$/m);
  });
});
