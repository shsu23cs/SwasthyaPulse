/**
 * React Query definitions for all API endpoints.
 * Components import from here instead of mock-data.ts.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, AlertStatus, CreateProjectPayload } from "@/lib/api";
import { toast } from "sonner";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const QK = {
  stats: ["stats"] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  posts: (params?: { project?: string; sentiment?: string; alertsOnly?: boolean }) =>
    ["posts", params ?? {}] as const,
  alerts: ["alerts"] as const,
  insights: ["insights"] as const,
};

// ─── Stats ────────────────────────────────────────────────────────────────────
export function useStats() {
  return useQuery({
    queryKey: QK.stats,
    queryFn: api.getStats,
    refetchInterval: 30_000, // refresh every 30 s
  });
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export function useProjects() {
  return useQuery({
    queryKey: QK.projects,
    queryFn: api.getProjects,
    refetchInterval: 60_000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: QK.project(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
    refetchInterval: 10_000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => api.createProject(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.projects });
      qc.invalidateQueries({ queryKey: QK.stats });
    },
  });
}

export function usePatchProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: "active" | "paused" } }) =>
      api.patchProject(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.project(id) });
      qc.invalidateQueries({ queryKey: QK.projects });
    },
  });
}

export function useTriggerCrawl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.triggerCrawl(id),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: QK.project(id) });
      qc.invalidateQueries({ queryKey: QK.posts() });
      qc.invalidateQueries({ queryKey: QK.stats });
      qc.invalidateQueries({ queryKey: QK.insights });
      
      if (data && data.detail) {
        toast.success(data.detail);
      } else {
        toast.success("Crawl complete.");
      }
    },
    onError: () => {
      toast.error("Failed to complete the crawl. Please try again.");
    }
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────
export function usePosts(params?: { project?: string; sentiment?: string; alertsOnly?: boolean }) {
  return useQuery({
    queryKey: QK.posts(params),
    queryFn: () => api.getPosts(params),
    refetchInterval: 10_000,
  });
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export function useAlerts() {
  return useQuery({
    queryKey: QK.alerts,
    queryFn: api.getAlerts,
    refetchInterval: 20_000,
  });
}

export function usePatchAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertStatus }) =>
      api.patchAlert(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.alerts });
      qc.invalidateQueries({ queryKey: QK.stats });
    },
  });
}

// ─── Insights ─────────────────────────────────────────────────────────────────
export function useInsights() {
  return useQuery({
    queryKey: QK.insights,
    queryFn: api.getInsights,
    refetchInterval: 60_000,
  });
}
