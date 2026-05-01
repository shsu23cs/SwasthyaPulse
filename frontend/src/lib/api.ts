/**
 * Typed fetch wrapper for the SwasthyaPulse REST API.
 * Base URL is empty so the Vite proxy routes /api/* to localhost:8000.
 */

const BASE = "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 
    "Content-Type": "application/json", 
    ...(init?.headers as Record<string, string> || {}) 
  };

  if (typeof window !== "undefined" && (window as any).Clerk?.session) {
    try {
      const token = await (window as any).Clerk.session.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Failed to get Clerk token", e);
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type Sentiment = "positive" | "negative" | "neutral";
export type Severity = "low" | "medium" | "high";
export type AlertStatus = "open" | "reviewed" | "escalated" | "dismissed";
export type Frequency = "realtime" | "hourly" | "daily";
export type ProjectStatus = "active" | "paused";

export interface Project {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  sources: string[];
  frequency: Frequency;
  status: ProjectStatus;
  posts_collected: number;
  alerts_triggered: number;
  created_at: string;
}

export interface Entities {
  drugs: string[];
  symptoms: string[];
  conditions: string[];
}

export interface Post {
  id: string;
  project_id: string;
  source: string;
  author: string;
  author_handle: string;
  url?: string;
  content: string;
  timestamp: string;
  sentiment: Sentiment;
  sentiment_score: number;
  keywords: string[];
  entities: Entities;
  has_alert: boolean;
  severity?: Severity;
  privacy_masked: boolean;
  alert_status: AlertStatus;
}

export interface TrendPoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

export interface Stats {
  total_projects: number;
  active_projects: number;
  posts_today: number;
  posts_trend: number;
  alerts_active: number;
  avg_sentiment: number;
  trend: TrendPoint[];
}

export interface EntityFrequency {
  name: string;
  count: number;
}

export interface ProjectVolume {
  name: string;
  posts: number;
  alerts: number;
}

export interface Insights {
  top_drugs: EntityFrequency[];
  top_symptoms: EntityFrequency[];
  top_keywords: EntityFrequency[];
  project_volume: ProjectVolume[];
  trend: TrendPoint[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  keywords?: string[];
  sources?: string[];
  frequency?: Frequency;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const api = {
  // Stats
  getStats: () => request<Stats>("/api/stats"),

  // Projects
  getProjects: () => request<Project[]>("/api/projects"),
  getProject: (id: string) => request<Project>(`/api/projects/${id}`),
  createProject: (payload: CreateProjectPayload) =>
    request<Project>("/api/projects", { method: "POST", body: JSON.stringify(payload) }),
  patchProject: (id: string, payload: { status?: "active" | "paused" }) =>
    request<Project>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  triggerCrawl: (id: string) =>
    request<{ detail: string }>(`/api/projects/${id}/crawl`, { method: "POST" }),

  // Posts
  getPosts: (params?: { project?: string; sentiment?: string; alertsOnly?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.project && params.project !== "all") qs.set("project", params.project);
    if (params?.sentiment && params.sentiment !== "all") qs.set("sentiment", params.sentiment);
    if (params?.alertsOnly) qs.set("alertsOnly", "true");
    const query = qs.toString();
    return request<Post[]>(`/api/posts${query ? `?${query}` : ""}`);
  },

  // Alerts
  getAlerts: () => request<Post[]>("/api/alerts"),
  patchAlert: (id: string, status: AlertStatus) =>
    request<Post>(`/api/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ alert_status: status }),
    }),

  // Insights
  getInsights: () => request<Insights>("/api/insights"),
};
