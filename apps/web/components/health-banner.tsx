"use client";
import { AlertTriangle } from "lucide-react";
import { ServerState, type ServerSummary } from "@ark/shared";

/**
 * Amber sibling of CrashBanner for a RUNNING-but-degraded server: the game
 * process is up, but a service it depends on isn't (the API's healthNote says
 * which). Renders nothing when healthy — the note clears itself server-side
 * the moment the condition does.
 */
export function HealthBanner({ server }: { server: ServerSummary }) {
  if (server.state !== ServerState.Running || !server.healthNote) return null;
  return (
    <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-amber-200">Running, but unhealthy</h3>
          <p className="mt-1 text-sm leading-snug text-amber-100/90">{server.healthNote}</p>
        </div>
      </div>
    </div>
  );
}
