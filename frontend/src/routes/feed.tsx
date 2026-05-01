import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { PostCard } from "@/components/widgets/PostCard";
import { useProjects, usePosts } from "@/lib/queries";
import { type Sentiment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Live Feed — SwasthyaPulse" },
      { name: "description", content: "Real-time stream of patient conversations across monitored projects." },
    ],
  }),
  component: FeedPage,
});

const sentimentFilters: Array<Sentiment | "all"> = ["all", "positive", "neutral", "negative"];

function FeedPage() {
  const [project, setProject] = useState<string>("all");
  const [sentiment, setSentiment] = useState<Sentiment | "all">("all");
  const [alertsOnly, setAlertsOnly] = useState(false);

  const { data: projects } = useProjects();
  const { data: posts, isLoading } = usePosts({
    project: project !== "all" ? project : undefined,
    sentiment: sentiment !== "all" ? sentiment : undefined,
    alertsOnly,
  });

  const filtered = useMemo(() => {
    return [...(posts ?? [])].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [posts]);

  return (
    <AppShell>
      <TopBar
        title="Live Feed"
        subtitle={isLoading ? "Loading posts…" : `${filtered.length} posts matching current filters · streaming`}
      />

      <div className="px-8 py-6 max-w-[1400px]">
        <div className="rounded-xl border border-border bg-card p-4 mb-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Project</span>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All projects</option>
              {(projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1">Sentiment</span>
            {sentimentFilters.map((s) => (
              <button
                key={s}
                onClick={() => setSentiment(s)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors capitalize border",
                  sentiment === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={alertsOnly}
              onChange={(e) => setAlertsOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-destructive"
            />
            <span className="text-[12.5px] text-foreground">Alerts only</span>
          </label>

          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => { setProject("all"); setSentiment("all"); setAlertsOnly(false); }}>
            Reset
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-[13px]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading posts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-[13px] text-muted-foreground">No posts match the current filters.</p>
            </div>
          ) : (
            filtered.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      </div>
    </AppShell>
  );
}
