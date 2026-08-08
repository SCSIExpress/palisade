import { describe, expect, it, vi, afterEach } from "vitest";
import { ProbeHealthTracker, PROBE_FAIL_THRESHOLD } from "./probe-health";

afterEach(() => vi.useRealTimers());

describe("ProbeHealthTracker", () => {
  it("never alarms for a server whose probe never succeeded (no credentials)", () => {
    const t = new ProbeHealthTracker();
    for (let i = 0; i < 50; i++) t.record("s1", false);
    expect(t.failingSince("s1")).toBeNull();
  });

  it("alarms only after the threshold of consecutive failures post-success", () => {
    const t = new ProbeHealthTracker();
    t.record("s1", true);
    for (let i = 0; i < PROBE_FAIL_THRESHOLD - 1; i++) {
      t.record("s1", false);
      expect(t.failingSince("s1")).toBeNull();
    }
    t.record("s1", false);
    expect(t.failingSince("s1")).not.toBeNull();
  });

  it("a single success clears the failure streak", () => {
    const t = new ProbeHealthTracker();
    t.record("s1", true);
    for (let i = 0; i < PROBE_FAIL_THRESHOLD; i++) t.record("s1", false);
    expect(t.failingSince("s1")).not.toBeNull();
    t.record("s1", true);
    expect(t.failingSince("s1")).toBeNull();
  });

  it("reports how long the probe has been failing", () => {
    vi.useFakeTimers();
    const t = new ProbeHealthTracker();
    t.record("s1", true);
    t.record("s1", false); // firstFailAt = now
    vi.advanceTimersByTime(5 * 60_000);
    for (let i = 0; i < PROBE_FAIL_THRESHOLD; i++) t.record("s1", false);
    const h = t.failingSince("s1");
    expect(h).not.toBeNull();
    expect(h!.failingForMs).toBeGreaterThanOrEqual(5 * 60_000);
  });

  it("reset() forgets the run (stop/crash/restart)", () => {
    const t = new ProbeHealthTracker();
    t.record("s1", true);
    for (let i = 0; i < PROBE_FAIL_THRESHOLD; i++) t.record("s1", false);
    t.reset("s1");
    expect(t.failingSince("s1")).toBeNull();
    for (let i = 0; i < PROBE_FAIL_THRESHOLD; i++) t.record("s1", false);
    expect(t.failingSince("s1")).toBeNull(); // must re-succeed first
  });
});
