import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { useAlerts, usePatchAlert, useProjects } from "@/lib/queries";
import { SeverityBadge } from "@/components/widgets/Badges";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import type { AlertStatus } from "@/lib/api";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — SwasthyaPulse" },
      { name: "description", content: "Safety and adverse-signal alerts surfaced from monitored conversations." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts();
  const { data: projects } = useProjects();
  const patchAlert = usePatchAlert();

  const sorted = [...(alerts ?? [])].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  const projectMap = Object.fromEntries((projects ?? []).map((p) => [p.id, p]));

  const handleAction = (id: string, status: AlertStatus) => {
    patchAlert.mutate({ id, status });
  };

  return (
    <AppShell>
      <TopBar
        title="Alerts"
        subtitle={isLoading ? "Loading…" : `${sorted.length} signals require review`}
      />

      <div className="px-8 py-6 max-w-[1100px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-[13px]">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading alerts…
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((a) => {
              const project = projectMap[a.project_id];
              const isDone = a.alert_status !== "open";
              return (
                <article key={a.id} className={`rounded-xl border bg-card p-5 transition-opacity ${isDone ? "opacity-60 border-border" : "border-destructive/25"}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {a.severity && <SeverityBadge severity={a.severity as "low" | "medium" | "high"} />}
                          <span className="text-[12px] text-muted-foreground">{a.source}</span>
                          <span className="text-muted-foreground/50 text-[12px]">·</span>
                          <span className="text-[12px] text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</span>
                          {isDone && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border capitalize">
                              {a.alert_status}
                            </span>
                          )}
                        </div>
                        {project && (
                          <Link
                            to="/projects/$projectId"
                            params={{ projectId: project.id }}
                            className="text-[12px] text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {project.name} <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <p className="text-[14px] text-foreground/90 mt-2 leading-relaxed">{a.content}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.entities.symptoms.map((s) => (
                          <span key={s} className="text-[11px] px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">⚕ {s}</span>
                        ))}
                      </div>
                      {!isDone && (
                        <div className="mt-4 pt-3 border-t border-border flex items-center gap-3">
                          <button
                            onClick={() => handleAction(a.id, "reviewed")}
                            className="text-[12px] font-medium text-primary hover:underline disabled:opacity-50"
                            disabled={patchAlert.isPending}
                          >
                            Mark reviewed
                          </button>
                          <button
                            onClick={() => handleAction(a.id, "escalated")}
                            className="text-[12px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                            disabled={patchAlert.isPending}
                          >
                            Escalate
                          </button>
                          <button
                            onClick={() => handleAction(a.id, "dismissed")}
                            className="text-[12px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                            disabled={patchAlert.isPending}
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
