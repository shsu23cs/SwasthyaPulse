import { cn } from "@/lib/utils";
import type { Sentiment, Severity } from "@/lib/mock-data";

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const map = {
    positive: "bg-success/10 text-success border-success/20",
    negative: "bg-destructive/10 text-destructive border-destructive/20",
    neutral: "bg-muted text-muted-foreground border-border",
  };
  const label = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        map[sentiment]
      )}
    >
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        sentiment === "positive" && "bg-success",
        sentiment === "negative" && "bg-destructive",
        sentiment === "neutral" && "bg-muted-foreground/60"
      )} />
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map = {
    high: "bg-destructive/10 text-destructive border-destructive/30",
    medium: "bg-warning/15 text-warning-foreground border-warning/40",
    low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        map[severity]
      )}
    >
      {severity}
    </span>
  );
}

export function StatusDot({ status }: { status: "active" | "paused" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" ? "bg-success" : "bg-muted-foreground/50"
        )}
      />
      {status === "active" ? "Active" : "Paused"}
    </span>
  );
}
