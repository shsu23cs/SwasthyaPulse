export type Sentiment = "positive" | "negative" | "neutral";
export type Severity = "low" | "medium" | "high";

export interface Project {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  sources: string[];
  frequency: "realtime" | "hourly" | "daily";
  status: "active" | "paused";
  postsCollected: number;
  alertsTriggered: number;
  createdAt: string;
}

export interface Post {
  id: string;
  projectId: string;
  source: string;
  author: string;
  authorHandle: string;
  content: string;
  timestamp: string;
  sentiment: Sentiment;
  sentimentScore: number;
  keywords: string[];
  entities: { drugs: string[]; symptoms: string[]; conditions: string[] };
  hasAlert: boolean;
  severity?: Severity;
  privacyMasked: boolean;
}

export const projects: Project[] = [
  {
    id: "p-onco-1",
    name: "Oncology Patient Voice",
    description: "Tracking patient discussions around immunotherapy and side effects.",
    keywords: ["immunotherapy", "pembrolizumab", "side effects", "fatigue"],
    sources: ["Twitter/X", "Reddit", "PatientsLikeMe", "HealthUnlocked"],
    frequency: "realtime",
    status: "active",
    postsCollected: 12483,
    alertsTriggered: 7,
    createdAt: "2025-02-14",
  },
  {
    id: "p-diab-2",
    name: "Diabetes Device Sentiment",
    description: "Continuous glucose monitor feedback across forums and social.",
    keywords: ["CGM", "Dexcom", "Libre", "sensor failure"],
    sources: ["Reddit", "Facebook Groups", "Twitter/X"],
    frequency: "hourly",
    status: "active",
    postsCollected: 8721,
    alertsTriggered: 3,
    createdAt: "2025-03-02",
  },
  {
    id: "p-vacc-3",
    name: "Vaccine Safety Monitoring",
    description: "Early signal detection for adverse events post-vaccination.",
    keywords: ["vaccine", "adverse event", "reaction", "myocarditis"],
    sources: ["Twitter/X", "Reddit", "News"],
    frequency: "realtime",
    status: "active",
    postsCollected: 21055,
    alertsTriggered: 14,
    createdAt: "2025-01-08",
  },
  {
    id: "p-mh-4",
    name: "Mental Health Conversations",
    description: "Sentiment around SSRIs and therapy access.",
    keywords: ["SSRI", "therapy", "anxiety", "depression"],
    sources: ["Reddit", "Twitter/X"],
    frequency: "daily",
    status: "paused",
    postsCollected: 5402,
    alertsTriggered: 1,
    createdAt: "2025-03-21",
  },
];

const sampleAuthors = [
  ["Maya R.", "@maya_r"],
  ["J. Patel", "@jpatel_md"],
  ["Anonymous", "@anon_user"],
  ["Care Advocate", "@care_advoc"],
  ["Sam K.", "@samk_health"],
  ["Dr. Lin", "@dr_lin"],
];

function makePosts(projectId: string, seed: number): Post[] {
  const templates: Array<Omit<Post, "id" | "projectId" | "timestamp">> = [
    {
      source: "Reddit",
      author: sampleAuthors[0][0],
      authorHandle: sampleAuthors[0][1],
      content:
        "Started [pembrolizumab] three weeks ago. Fatigue is heavy but manageable. Anyone else dealing with joint pain?",
      sentiment: "neutral",
      sentimentScore: 0.05,
      keywords: ["pembrolizumab", "fatigue"],
      entities: { drugs: ["pembrolizumab"], symptoms: ["fatigue", "joint pain"], conditions: [] },
      hasAlert: false,
      privacyMasked: false,
    },
    {
      source: "Twitter/X",
      author: sampleAuthors[1][0],
      authorHandle: sampleAuthors[1][1],
      content:
        "Severe shortness of breath after second dose — went to ER last night. Reporting to physician today. Patient ID ███-██-████ masked.",
      sentiment: "negative",
      sentimentScore: -0.82,
      keywords: ["shortness of breath", "ER"],
      entities: { drugs: [], symptoms: ["shortness of breath"], conditions: [] },
      hasAlert: true,
      severity: "high",
      privacyMasked: true,
    },
    {
      source: "PatientsLikeMe",
      author: sampleAuthors[2][0],
      authorHandle: sampleAuthors[2][1],
      content:
        "Six months in and my scans look great. The team has been incredible. Side effects manageable with proper hydration.",
      sentiment: "positive",
      sentimentScore: 0.78,
      keywords: ["scans", "side effects"],
      entities: { drugs: [], symptoms: [], conditions: [] },
      hasAlert: false,
      privacyMasked: false,
    },
    {
      source: "Reddit",
      author: sampleAuthors[3][0],
      authorHandle: sampleAuthors[3][1],
      content:
        "CGM sensor failed on day 4 again. Third time this month. Customer service replacement is slow. Frustrating for type 1 management.",
      sentiment: "negative",
      sentimentScore: -0.55,
      keywords: ["CGM", "sensor failure"],
      entities: { drugs: [], symptoms: [], conditions: ["type 1 diabetes"] },
      hasAlert: false,
      privacyMasked: false,
    },
    {
      source: "HealthUnlocked",
      author: sampleAuthors[4][0],
      authorHandle: sampleAuthors[4][1],
      content:
        "Anyone experienced chest tightness after immunotherapy? Lasted ~2 hours, resolved on its own. Doctor wants to monitor.",
      sentiment: "negative",
      sentimentScore: -0.48,
      keywords: ["immunotherapy", "chest tightness"],
      entities: { drugs: [], symptoms: ["chest tightness"], conditions: [] },
      hasAlert: true,
      severity: "medium",
      privacyMasked: false,
    },
    {
      source: "Twitter/X",
      author: sampleAuthors[5][0],
      authorHandle: sampleAuthors[5][1],
      content:
        "New data on adjuvant therapy looking promising. Patient adherence remains the central challenge in real-world settings.",
      sentiment: "positive",
      sentimentScore: 0.62,
      keywords: ["adjuvant therapy", "adherence"],
      entities: { drugs: [], symptoms: [], conditions: [] },
      hasAlert: false,
      privacyMasked: false,
    },
  ];

  return templates.map((t, i) => ({
    ...t,
    id: `${projectId}-post-${seed}-${i}`,
    projectId,
    timestamp: new Date(Date.now() - (i * 37 + seed * 11) * 60_000).toISOString(),
  }));
}

export const posts: Post[] = projects.flatMap((p, idx) => makePosts(p.id, idx + 1));

export function getProject(id: string) {
  return projects.find((p) => p.id === id);
}

export function getProjectPosts(id: string) {
  return posts.filter((p) => p.projectId === id);
}

// Time series data (last 14 days)
export function getTrendData(projectId: string) {
  const days = 14;
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    const seed = (projectId.length + i) * 7;
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      positive: 20 + ((seed * 3) % 35),
      negative: 10 + ((seed * 5) % 25),
      neutral: 30 + ((seed * 2) % 20),
    };
  });
}

export function getSentimentBreakdown(projectId: string) {
  const ps = getProjectPosts(projectId);
  const total = ps.length || 1;
  const counts = { positive: 0, negative: 0, neutral: 0 };
  ps.forEach((p) => counts[p.sentiment]++);
  return [
    { name: "Positive", value: Math.round((counts.positive / total) * 100), color: "var(--success)" },
    { name: "Neutral", value: Math.round((counts.neutral / total) * 100), color: "var(--muted-foreground)" },
    { name: "Negative", value: Math.round((counts.negative / total) * 100), color: "var(--destructive)" },
  ];
}

export const overviewStats = {
  totalProjects: projects.length,
  activeProjects: projects.filter((p) => p.status === "active").length,
  postsToday: 1842,
  postsTrend: 12.4,
  alertsActive: projects.reduce((s, p) => s + p.alertsTriggered, 0),
  avgSentiment: 0.18,
};
