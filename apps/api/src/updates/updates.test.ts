import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { parseAcfBuildId, pickPublicBuildId, findManifest } from "./updates.service";

describe("parseAcfBuildId", () => {
  it("extracts the build id from a SteamCMD appmanifest", () => {
    const acf = [
      '"AppState"',
      "{",
      '\t"appid"\t\t"2430930"',
      '\t"Universe"\t\t"1"',
      '\t"buildid"\t\t"17284560"',
      '\t"name"\t\t"ARK Survival Ascended Dedicated Server"',
      "}",
    ].join("\n");
    expect(parseAcfBuildId(acf)).toBe(17284560);
  });

  it("returns null when there is no buildid", () => {
    expect(parseAcfBuildId('"AppState" {\n"appid" "2430930"\n}')).toBeNull();
    expect(parseAcfBuildId("")).toBeNull();
  });
});

describe("pickPublicBuildId", () => {
  it("reads data.<appid>.depots.branches.public.buildid", () => {
    const json = {
      data: { "2430930": { depots: { branches: { public: { buildid: "17284560" } } } } },
    };
    expect(pickPublicBuildId(json, 2430930)).toBe(17284560);
  });

  it("returns null for missing or malformed shapes", () => {
    expect(pickPublicBuildId({}, 2430930)).toBeNull();
    expect(pickPublicBuildId({ data: {} }, 2430930)).toBeNull();
    expect(pickPublicBuildId({ data: { "2430930": {} } }, 2430930)).toBeNull();
    expect(pickPublicBuildId(null, 2430930)).toBeNull();
  });
});

describe("findManifest", () => {
  // Every manifest nesting OBSERVED on live installs (GH #16 + tower):
  // ASA also writes a root-level copy; Icarus is two levels deep.
  const LAYOUTS: [string, string][] = [
    ["ASA (root copy)", "appmanifest_2430930.acf"],
    ["ASA/Palworld-Wine", "steamapps/appmanifest_2394010.acf"],
    ["Conan", "server/steamapps/appmanifest_443030.acf"],
    ["Valheim/Zomboid/VRising/7DTD", "serverfiles/steamapps/appmanifest_896660.acf"],
    ["SotF", "game/steamapps/appmanifest_2465200.acf"],
    ["Icarus", "gamefiles/server/steamapps/appmanifest_2089300.acf"],
  ];

  let base: string;
  beforeAll(async () => {
    base = await mkdtemp(join(tmpdir(), "palisade-manifest-"));
  });
  afterAll(async () => {
    await rm(base, { recursive: true, force: true });
  });

  for (const [label, rel] of LAYOUTS) {
    it(`finds the ${label} layout: ${rel}`, async () => {
      const root = join(base, label.replace(/[^a-z]/gi, "_"));
      const full = join(root, rel);
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, '"AppState" { "buildid" "123" }');
      // Noise: sibling dirs that must be probed past, not tripped over.
      await mkdir(join(root, "logs"), { recursive: true });
      await mkdir(join(root, "config", "sub"), { recursive: true });
      expect(await findManifest(root, rel.split("/").pop()!)).toBe(full);
    });
  }

  it("returns null when the manifest is absent or the root doesn't exist", async () => {
    const root = join(base, "empty");
    await mkdir(join(root, "serverfiles"), { recursive: true });
    expect(await findManifest(root, "appmanifest_1.acf")).toBeNull();
    expect(await findManifest(join(base, "no-such-dir"), "appmanifest_1.acf")).toBeNull();
  });

  it("does not descend beyond maxDepth (never walks the game tree)", async () => {
    const root = join(base, "deep");
    const tooDeep = join(root, "a", "b", "c", "steamapps", "appmanifest_9.acf");
    await mkdir(dirname(tooDeep), { recursive: true });
    await writeFile(tooDeep, '"buildid" "9"');
    expect(await findManifest(root, "appmanifest_9.acf")).toBeNull(); // depth 3 > default 2
    expect(await findManifest(root, "appmanifest_9.acf", 3)).toBe(tooDeep);
  });
});
