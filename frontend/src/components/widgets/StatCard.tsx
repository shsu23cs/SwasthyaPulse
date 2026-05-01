import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "alert";
}

export function StatCard({ label, value, delta, hint, icon, tone = "default" }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm",
        tone === "alert" ? "border-destructive/30" : "border-border"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn(
            "text-[26px] font-semibold tracking-tight leading-none",
            tone === "alert" ? "text-destructive" : "text-foreground"
          )}>
            {value}
          </p>
        </div>
        {icon && (
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center",
            tone === "alert" ? "bg-destructive/10 text-destructive" : "bg-primary/8 text-primary"
          )}>
            {icon}
          </div>
        )}
      </div>
      {(delta !== undefined || hint) && (
        <div className="mt-3 flex items-center gap-1.5 text-[12px]">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                delta >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
