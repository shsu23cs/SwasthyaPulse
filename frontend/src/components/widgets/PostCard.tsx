import type { Post } from "@/lib/api";
import { SentimentBadge, SeverityBadge } from "./Badges";
import { AlertTriangle, Shield, MessageCircle, ExternalLink } from "lucide-react";

function highlightKeywords(text: string, keywords: string[]) {
  if (keywords.length === 0) return text;
  const regex = new RegExp(`\\b(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    keywords.some(k => k.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-accent/15 text-accent-foreground rounded px-0.5 font-medium">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[12px] font-semibold shrink-0">
          {post.author.split(" ").map(s => s[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[13px] font-semibold text-foreground truncate">{post.author}</span>
              <span className="text-[12px] text-muted-foreground truncate">{post.author_handle}</span>
              <span className="text-muted-foreground/50 text-[12px]">·</span>
              <span className="text-[12px] text-muted-foreground">{post.source}</span>
              <span className="text-muted-foreground/50 text-[12px]">·</span>
              <span className="text-[12px] text-muted-foreground">{timeAgo(post.timestamp)}</span>
              {post.url && (
                <>
                  <span className="text-muted-foreground/50 text-[12px]">·</span>
                  <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline" title="View original post">
                    <ExternalLink className="h-3 w-3" /> Source
                  </a>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {post.privacy_masked && (
                <span className="inline-flex items-center gap-1 text-[11px] text-accent font-medium" title="Sensitive data masked">
                  <Shield className="h-3 w-3" /> Masked
                </span>
              )}
              <SentimentBadge sentiment={post.sentiment} />
              {post.has_alert && post.severity && <SeverityBadge severity={post.severity} />}
            </div>
          </div>

          <p className="mt-2 text-[14px] leading-relaxed text-foreground/90">
            {highlightKeywords(post.content, post.keywords)}
          </p>

          {(post.entities.drugs.length > 0 ||
            post.entities.symptoms.length > 0 ||
            post.entities.conditions.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.entities.drugs.map(d => (
                <span key={d} className="text-[11px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/15">
                  💊 {d}
                </span>
              ))}
              {post.entities.symptoms.map(s => (
                <span key={s} className="text-[11px] px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                  ⚕ {s}
                </span>
              ))}
              {post.entities.conditions.map(c => (
                <span key={c} className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                  {c}
                </span>
              ))}
            </div>
          )}

          {post.has_alert && (
            <div className="mt-3 flex items-start gap-2 p-2.5 rounded-md bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <p className="text-[12px] text-destructive/90">
                Adverse signal detected — flagged for safety review.
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-[12px] text-muted-foreground">
            <button className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
              <MessageCircle className="h-3.5 w-3.5" /> Add note
            </button>
            <span>Confidence {Math.round(Math.abs(post.sentiment_score) * 100)}%</span>
          </div>
        </div>
      </div>
    </article>
  );
}
