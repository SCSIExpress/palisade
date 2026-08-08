import { describe, expect, it } from "vitest";

// The regex is module-private by design; mirror it here as the contract test.
const STEAM_TRANSIENT_RE =
  /state is 0x[0-9a-f]+ after update job|Failed to get manifest request code|Connecting anonymously to Steam Public\.*\s*(FAILED|timed? ?out)/i;

describe("STEAM_TRANSIENT_RE", () => {
  it("matches the real DST 2026-08-07 failures", () => {
    expect(STEAM_TRANSIENT_RE.test("Error! App '343050' state is 0x6 after update job.")).toBe(true);
    expect(
      STEAM_TRANSIENT_RE.test(
        "CDepotDownloadMgr::BYldRequestDepotManifest(App: 343050, Depot: 343052): Failed to get manifest request code, 'Access Denied'",
      ),
    ).toBe(true);
    expect(STEAM_TRANSIENT_RE.test("Connecting anonymously to Steam Public...FAILED")).toBe(true);
  });

  it("does NOT match real config/image crashes", () => {
    expect(STEAM_TRANSIENT_RE.test("exit code 139 (segfault) — LD_PRELOAD broke bash")).toBe(false);
    expect(STEAM_TRANSIENT_RE.test("mkstemp: Permission denied")).toBe(false);
    expect(STEAM_TRANSIENT_RE.test("E_INVALID_TOKEN — Your Server Will Not Start")).toBe(false);
    expect(STEAM_TRANSIENT_RE.test("OOMKilled: container exceeded memory limit")).toBe(false);
  });
});
