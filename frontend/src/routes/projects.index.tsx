import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { StatusDot } from "@/components/widgets/Badges";
import { useProjects, useCreateProject } from "@/lib/queries";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertTriangle, MessageSquare, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — SwasthyaPulse" },
      { name: "description", content: "Manage healthcare social listening projects, keywords, and sources." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [keywords, setKeywords] = useState("");
  const [sources, setSources] = useState("all");
  const [frequency, setFrequency] = useState<"realtime" | "hourly" | "daily">("daily");

  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  
  const { user } = useUser();
  // Default to admin if no role is explicitly set to avoid blocking developers
  const isAdmin = !user?.publicMetadata?.role || user?.publicMetadata?.role === "admin";

  const SOURCE_MAP: Record<string, string[]> = {
    all: ["Reddit", "Twitter/X", "Patient Forums", "News", "Web"],
    reddit: ["Reddit"],
    twitter: ["Twitter/X"],
    forums: ["PatientsLikeMe", "HealthUnlocked", "Patient.info"],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createProject.mutateAsync({
      name: name.trim(),
      description: desc.trim(),
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      sources: SOURCE_MAP[sources] ?? SOURCE_MAP.all,
      frequency,
    });
    setOpen(false);
    setName(""); setDesc(""); setKeywords("");
  };

  return (
    <AppShell>
      <TopBar
        title="Projects"
        subtitle="Configure listening scope, sources, and collection cadence."
        actions={
          isAdmin ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1.5 text-[13px]">
                  <Plus className="h-3.5 w-3.5" /> New Project
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Create new project</DialogTitle>
                <DialogDescription>
                  Define what you want to listen for and where.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 py-2" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[12px]">Project name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cardiology Patient Voice" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desc" className="text-[12px]">Description</Label>
                  <Textarea id="desc" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief context for collaborators…" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kw" className="text-[12px]">Keywords (comma-separated)</Label>
                  <Input id="kw" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="statin, side effects, muscle pain" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[12px]">Sources</Label>
                    <Select value={sources} onValueChange={setSources}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        <SelectItem value="reddit">Reddit only</SelectItem>
                        <SelectItem value="twitter">Twitter/X only</SelectItem>
                        <SelectItem value="forums">Patient forums</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px]">Frequency</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createProject.isPending}>
                    {createProject.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    Create project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          ) : (
            <Button size="sm" variant="outline" className="h-9 gap-1.5 text-[13px] opacity-70" onClick={() => toast.error("Admin access required to create projects.")}>
              <Plus className="h-3.5 w-3.5" /> New Project
            </Button>
          )
        }
      />

      <div className="px-8 py-7 max-w-[1400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-[13px]">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading projects…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(projects ?? []).map((p) => (
              <Link
                key={p.id}
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-foreground tracking-tight truncate">
                      {p.name}
                    </h3>
                    <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-3 mt-1" />
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.keywords.slice(0, 4).map((k) => (
                    <span key={k} className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                      {k}
                    </span>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {p.posts_collected.toLocaleString()}
                    </span>
                    {p.alerts_triggered > 0 && (
                      <span className="inline-flex items-center gap-1 text-destructive font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {p.alerts_triggered}
                      </span>
                    )}
                  </div>
                  <StatusDot status={p.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
