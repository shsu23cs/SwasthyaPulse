import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { useInsights } from "@/lib/queries";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — SwasthyaPulse" },
      { name: "description", content: "Cross-project trends, top entities, and emerging conversation themes." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { data: insights, isLoading } = useInsights();

  if (isLoading) {
    return (
      <AppShell>
        <TopBar title="Insights" subtitle="Cross-project analytics and emerging themes." />
        <div className="flex items-center justify-center py-20 text-muted-foreground text-[13px]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading insights…
        </div>
      </AppShell>
    );
  }

  const projectVolume = insights?.project_volume ?? [];
  const trend = insights?.trend ?? [];
  const drugTop = insights?.top_drugs ?? [];
  const symptomTop = insights?.top_symptoms ?? [];

  return (
    <AppShell>
      <TopBar
        title="Insights"
        subtitle="Cross-project analytics and emerging themes."
      />

      <div className="px-8 py-7 space-y-6 max-w-[1400px]">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-[14px] font-semibold text-foreground mb-4">Conversation Volume by Project</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectVolume} margin={{ left: -10, right: 8, top: 5, bottom: 5 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="posts" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-[14px] font-semibold text-foreground mb-4">Sentiment Trajectory · 14 days</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="ins-pos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="positive" stroke="var(--accent)" strokeWidth={1.75} fill="url(#ins-pos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EntityRank title="Most Mentioned Drugs" items={drugTop} />
          <EntityRank title="Most Mentioned Symptoms" items={symptomTop} />
        </div>
      </div>
    </AppShell>
  );
}

function EntityRank({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-[14px] font-semibold text-foreground mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={it.name} className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-muted-foreground w-4">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between text-[12.5px] mb-1">
                  <span className="font-medium text-foreground">{it.name}</span>
                  <span className="text-muted-foreground">{it.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: `${(it.count / max) * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
