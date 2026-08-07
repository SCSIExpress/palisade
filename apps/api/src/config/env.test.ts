import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadEnv, resetEnvCache } from "./env";

/** Unraid passes BLANK template fields as EMPTY STRINGS — the boot must survive that
 *  (GH #6: PUBLIC_BASE_URL="" crashed the container before the empty-as-unset filter). */
describe("loadEnv", () => {
  const saved: Record<string, string | undefined> = {};
  const KEYS = ["PUBLIC_BASE_URL", "SECRETS_KEY", "JWT_SECRET", "HOST_DATA_DIR", "TZ"];

  beforeEach(() => {
    for (const k of KEYS) saved[k] = process.env[k];
    process.env.SECRETS_KEY = "a".repeat(64);
    process.env.JWT_SECRET = "test-jwt-secret-1234";
    resetEnvCache();
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    resetEnvCache();
  });

  it("treats an empty PUBLIC_BASE_URL as unset (the Unraid blank-field case)", () => {
    process.env.PUBLIC_BASE_URL = "";
    expect(loadEnv().PUBLIC_BASE_URL).toBe("http://localhost:3000");
  });

  it("treats a whitespace-only value as unset", () => {
    process.env.PUBLIC_BASE_URL = "   ";
    expect(loadEnv().PUBLIC_BASE_URL).toBe("http://localhost:3000");
  });

  it("keeps a real PUBLIC_BASE_URL", () => {
    process.env.PUBLIC_BASE_URL = "http://10.10.10.10:8970";
    expect(loadEnv().PUBLIC_BASE_URL).toBe("http://10.10.10.10:8970");
  });

  it("prepends http:// to a scheme-less PUBLIC_BASE_URL instead of crashing", () => {
    process.env.PUBLIC_BASE_URL = "10.10.10.10:8970";
    expect(loadEnv().PUBLIC_BASE_URL).toBe("http://10.10.10.10:8970");
  });

  it("leaves https URLs alone", () => {
    process.env.PUBLIC_BASE_URL = "https://panel.example.com";
    expect(loadEnv().PUBLIC_BASE_URL).toBe("https://panel.example.com");
  });

  it("empty optional vars fall back to their defaults too", () => {
    process.env.HOST_DATA_DIR = ""; // .optional() would otherwise capture ""
    process.env.TZ = "";
    const env = loadEnv();
    expect(env.HOST_DATA_DIR).toBeUndefined();
    expect(env.TZ).toBe("UTC");
  });
});
