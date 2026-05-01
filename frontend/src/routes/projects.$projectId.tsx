import { createFileRoute, Link } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/widgets/StatCard";
import { PostCard } from "@/components/widgets/PostCard";
import { StatusDot } from "@/components/widgets/Badges";
import { useProject, usePosts, useTriggerCrawl, usePatchProject } from "@/lib/queries";
import { ChevronRight, Activity, AlertTriangle, MessageSquare, TrendingUp, Pause, Play, Settings, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId")({
  head: ({ params }) => ({
    meta: [
      { title: `Project — SwasthyaPulse` },
      { name: "description", content: `Project detail for ${params.projectId}` },
    ],
  }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: projectPosts, isLoading: postsLoading } = usePosts({ project: projectId });
  const triggerCrawl = useTriggerCrawl();
  const patchProject = usePatchProject();

  const { user } = useUser();
  // Default to admin if no role is explicitly set to avoid blocking developers
  const isAdmin = !user?.publicMetadata?.role || user?.publicMetadata?.role === "admin";

  const breakdown = useMemo(() => {
    if (!projectPosts || projectPosts.length === 0) return [];
    const total = projectPosts.length;
    const counts = { positive: 0, negative: 0, neutral: 0 };
    projectPosts.forEach((p) => { counts[p.sentiment as keyof typeof counts]++; });
    return [
      { name: "Positive", value: Math.round((counts.positive / total) * 100), color: "var(--success)" },
      { name: "Neutral", value: Math.round((counts.neutral / total) * 100), color: "var(--muted-foreground)" },
      { name: "Negative", value: Math.round((counts.negative / total) * 100), color: "var(--destructive)" },
    ];
  }, [projectPosts]);

  const trend = useMemo(() => {
    if (!projectPosts || projectPosts.length === 0) return [];
    const days = 14;
    const now = new Date();
    const dayMap = new Map<string, { positive: number; negative: number; neutral: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap.set(label, { positive: 0, negative: 0, neutral: 0 });
    }
    projectPosts.forEach((p) => {
      const label = new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const entry = dayMap.get(label);
      if (entry) entry[p.sentiment as keyof typeof entry]++;
    });
    return Array.from(dayMap.entries()).map(([date, counts]) => ({ date, ...counts }));
  }, [projectPosts]);

  // Entity counts
  const { drugCounts, symptomCounts } = useMemo(() => {
    const drugMap = new Map<string, number>();
    const symptomMap = new Map<string, number>();
    (projectPosts ?? []).forEach((p) => {
      p.entities.drugs.forEach((d) => drugMap.set(d, (drugMap.get(d) || 0) + 1));
      p.entities.symptoms.forEach((s) => symptomMap.set(s, (symptomMap.get(s) || 0) + 1));
    });
    const top = (m: Map<string, number>) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
    return { drugCounts: top(drugMap), symptomCounts: top(symptomMap) };
  }, [projectPosts]);

  if (projectLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20 text-muted-foreground text-[13px]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading project…
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="p-10">
          <h1 className="text-xl font-semibold">Project not found</h1>
          <Link to="/projects" className="text-primary text-sm mt-2 inline-block">Back to projects</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        title={project.name}
        subtitle={project.description}
        context={
          <nav className="flex items-center text-[12px] text-muted-foreground gap-1">
            <Link to="/projects" className="hover:text-foreground">Projects</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground/80">{project.name}</span>
            <span className="ml-3"><StatusDot status={project.status} /></span>
          </nav>
        }
        actions={
          <>
            <Button
              size="sm" variant="outline" className={`h-9 text-[13px] gap-1.5 ${!isAdmin && "opacity-70"}`}
              onClick={() => isAdmin ? triggerCrawl.mutate(project.id) : toast.error("Admin access required to crawl data.")}
              disabled={triggerCrawl.isPending}
            >
              {triggerCrawl.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              Crawl now
            </Button>
            <Button
              size="sm" variant="outline" className={`h-9 text-[13px] gap-1.5 ${!isAdmin && "opacity-70"}`}
              onClick={() => isAdmin ? patchProject.mutate({ id: project.id, payload: { status: project.status === "active" ? "paused" : "active" } }) : toast.error("Admin access required to change project status.")}
              disabled={patchProject.isPending}
            >
              {patchProject.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                project.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />
              )}
              {project.status === "active" ? "Pause" : "Resume"}
            </Button>
            <Button size="sm" variant="outline" className="h-9 text-[13px] gap-1.5" onClick={() => isAdmin ? toast.info("Project configuration will be available in the next release.") : toast.error("Admin access required to configure projects.")}>
              <Settings className="h-3.5 w-3.5" /> Configure
            </Button>
          </>
        }
      />

      <div className="px-8 py-7 space-y-7 max-w-[1400px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Posts Collected" value={project.posts_collected.toLocaleString()} icon={<MessageSquare className="h-4 w-4" />} hint={`${project.frequency} updates`} />
          <StatCard label="This Week" value={postsLoading ? "—" : `+${(projectPosts ?? []).length}`} icon={<Activity className="h-4 w-4" />} />
          <StatCard label="Active Alerts" value={project.alerts_triggered} tone={project.alerts_triggered > 0 ? "alert" : "default"} icon={<AlertTriangle className="h-4 w-4" />} hint="needs review" />
          <StatCard
            label="Sentiment Index"
            value={
              projectPosts && projectPosts.length > 0
                ? `${(projectPosts.reduce((s, p) => s + p.sentiment_score, 0) / projectPosts.length >= 0 ? "+" : "")}${(projectPosts.reduce((s, p) => s + p.sentiment_score, 0) / projectPosts.length).toFixed(2)}`
                : "—"
            }
            icon={<TrendingUp className="h-4 w-4" />}
            hint="avg of collected posts"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Configuration</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Listening scope for this project</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {project.keywords.map((k) => (
                  <span key={k} className="text-[12px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/15">{k}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Sources</p>
              <div className="flex flex-wrap gap-1.5">
                {project.sources.map((s) => (
                  <span key={s} className="text-[12px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Cadence</p>
              <p className="text-[13px] text-foreground capitalize">{project.frequency} collection</p>
              <p className="text-[12px] text-muted-foreground mt-1">Created {new Date(project.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Volume & Sentiment</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Daily breakdown · last 14 days</p>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ left: -20, right: 8, top: 5, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="positive" stroke="var(--success)" strokeWidth={1.75} dot={false} />
                  <Line type="monotone" dataKey="neutral" stroke="var(--muted-foreground)" strokeWidth={1.75} dot={false} />
                  <Line type="monotone" dataKey="negative" stroke="var(--destructive)" strokeWidth={1.75} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-[14px] font-semibold text-foreground">Sentiment Mix</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Overall distribution</p>
            <div className="h-[200px] mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2} stroke="var(--card)" strokeWidth={2}>
                    {breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5">
              {breakdown.map((b) => (
                <li key={b.name} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                    {b.name}
                  </span>
                  <span className="font-medium text-foreground">{b.value}%</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EntitySection title="Top Drugs Mentioned" items={drugCounts} accent="primary" />
          <EntitySection title="Top Symptoms Mentioned" items={symptomCounts} accent="accent" />
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-foreground">Recent Posts</h2>
            <Link to="/feed" className="text-[12px] text-primary hover:underline">View all in Feed</Link>
          </div>
          {postsLoading ? (
            <div className="flex items-center text-muted-foreground text-[13px] gap-2 py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading posts…
            </div>
          ) : (
            <div className="space-y-3">
              {(projectPosts ?? []).slice(0, 5).map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function EntitySection({ title, items, accent }: { title: string; items: { name: string; count: number }[]; accent: "primary" | "accent" }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-[14px] font-semibold text-foreground mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">No mentions detected yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={it.name}>
              <div className="flex items-center justify-between text-[12.5px] mb-1">
                <span className="font-medium text-foreground">{it.name}</span>
                <span className="text-muted-foreground">{it.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={accent === "primary" ? "h-full bg-primary/70" : "h-full bg-accent/70"}
                  style={{ width: `${(it.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
