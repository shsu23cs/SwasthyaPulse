import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/widgets/StatCard";
import { PostCard } from "@/components/widgets/PostCard";
import { StatusDot } from "@/components/widgets/Badges";
import { useStats, useProjects, usePosts } from "@/lib/queries";
import { FolderKanban, Activity, AlertTriangle, Smile, ArrowRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — SwasthyaPulse" },
      { name: "description", content: "Real-time overview of healthcare conversations across your projects." },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { data: stats } = useStats();
  const { data: projects } = useProjects();
  const { data: posts } = usePosts();

  const trend = stats?.trend ?? [];
  const recentAlerts = (posts ?? []).filter((p) => p.has_alert).slice(0, 3);
  const recentPosts = [...(posts ?? [])].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 4);

  return (
    <AppShell>
      <TopBar
        title="Overview"
        subtitle="Cross-project signal at a glance — updated continuously."
      />
      <div className="px-8 py-7 space-y-7 max-w-[1400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Projects"
            value={stats?.active_projects ?? "—"}
            hint={stats ? `of ${stats.total_projects} total` : "loading…"}
            icon={<FolderKanban className="h-4 w-4" />}
          />
          <StatCard
            label="Posts Today"
            value={stats ? stats.posts_today.toLocaleString() : "—"}
            delta={stats?.posts_trend}
            hint="vs. yesterday"
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            label="Active Alerts"
            value={stats?.alerts_active ?? "—"}
            hint="across all projects"
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="alert"
          />
          <StatCard
            label="Avg. Sentiment"
            value={stats ? `${stats.avg_sentiment >= 0 ? "+" : ""}${stats.avg_sentiment.toFixed(2)}` : "—"}
            hint="7-day moving avg"
            icon={<Smile className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Sentiment Trend</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Last 14 days, all projects</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success"/>Positive</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/60"/>Neutral</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive"/>Negative</span>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: -20, right: 8, top: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--success)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="neg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="positive" stroke="var(--success)" strokeWidth={1.5} fill="url(#pos)" />
                  <Area type="monotone" dataKey="neutral" stroke="var(--muted-foreground)" strokeWidth={1.5} fill="transparent" />
                  <Area type="monotone" dataKey="negative" stroke="var(--destructive)" strokeWidth={1.5} fill="url(#neg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-foreground">Active Projects</h2>
              <Link to="/projects" className="text-[12px] text-primary hover:underline inline-flex items-center gap-0.5">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="space-y-1">
              {(projects ?? []).slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="block px-3 py-2.5 -mx-3 rounded-md hover:bg-secondary/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-foreground truncate">{p.name}</span>
                      <StatusDot status={p.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{p.posts_collected.toLocaleString()} posts</span>
                      {p.alerts_triggered > 0 && (
                        <span className="text-destructive font-medium">{p.alerts_triggered} alerts</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground">Recent Activity</h2>
              <Link to="/feed" className="text-[12px] text-primary hover:underline inline-flex items-center gap-0.5">
                Open Feed <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentPosts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground">Recent Alerts</h2>
              <Link to="/alerts" className="text-[12px] text-primary hover:underline inline-flex items-center gap-0.5">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentAlerts.map((a) => (
                <div key={a.id} className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-destructive uppercase tracking-wide">
                        {a.severity} severity
                      </p>
                      <p className="text-[13px] text-foreground/90 mt-1 line-clamp-3">{a.content}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">{a.source} · {a.author}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
