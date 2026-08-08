import { ServerState } from "@ark/shared";
import clsx from "clsx";

const STYLES: Record<ServerState, string> = {
  [ServerState.Running]: "bg-green-500/15 text-green-400 border-green-500/30",
  [ServerState.Starting]: "bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse",
  [ServerState.Stopping]: "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse",
  [ServerState.Stopped]: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  [ServerState.Installing]: "bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse",
  [ServerState.Updating]: "bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse",
  [ServerState.Crashed]: "bg-red-500/15 text-red-400 border-red-500/30",
};

/**
 * When a Running server carries a healthNote (process up, but a dependency it
 * needs is down — e.g. DST unregistered with Klei), the badge turns amber
 * "Unhealthy" so the degradation is visible everywhere the state is, not just
 * in the logs. The note itself rides the title; the server page shows a banner.
 */
export function StateBadge({ state, healthNote }: { state: ServerState; healthNote?: string | null }) {
  const unhealthy = state === ServerState.Running && Boolean(healthNote);
  return (
    <span
      title={unhealthy ? (healthNote ?? undefined) : undefined}
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        unhealthy ? "border-amber-500/30 bg-amber-500/15 text-amber-400" : STYLES[state],
      )}
    >
      {unhealthy ? "Unhealthy" : state}
    </span>
  );
}
