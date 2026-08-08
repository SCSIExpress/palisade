/**
 * Per-server probe-health tracking: "was answering, stopped answering".
 *
 * Fed by the player-count prober (which the 30 s history sampler drives for
 * every live server, UI open or not). A server only becomes unhealthy after
 * its probe SUCCEEDED at least once this run — games with no configured
 * credentials (RCON without an admin password, TShock without a token) return
 * null forever and must never alarm — and then failed enough consecutive
 * times to rule out a one-off packet drop.
 */
export interface ProbeHealthState {
  everOk: boolean;
  consecFails: number;
  firstFailAt: number;
}

/** Consecutive misses before "unhealthy" — 6 × 30 s sampler cadence ≈ 3 min. */
export const PROBE_FAIL_THRESHOLD = 6;

export class ProbeHealthTracker {
  private readonly state = new Map<string, ProbeHealthState>();

  /** Record one probe outcome for a RUNNING server. */
  record(serverId: string, ok: boolean): void {
    const e = this.state.get(serverId) ?? { everOk: false, consecFails: 0, firstFailAt: 0 };
    if (ok) {
      e.everOk = true;
      e.consecFails = 0;
      e.firstFailAt = 0;
    } else if (e.everOk) {
      e.consecFails += 1;
      if (e.firstFailAt === 0) e.firstFailAt = Date.now();
    }
    this.state.set(serverId, e);
  }

  /** Server left Running (stop/crash/restart) — forget the run's history. */
  reset(serverId: string): void {
    this.state.delete(serverId);
  }

  /** Non-null when the server was answering and has now been silent past the
   *  threshold; reports how long it's been failing. */
  failingSince(serverId: string): { failingForMs: number } | null {
    const e = this.state.get(serverId);
    if (!e?.everOk || e.consecFails < PROBE_FAIL_THRESHOLD) return null;
    return { failingForMs: Date.now() - e.firstFailAt };
  }
}
