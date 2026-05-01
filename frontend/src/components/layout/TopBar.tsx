import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserButton } from "@clerk/clerk-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  context?: React.ReactNode;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, context, actions }: TopBarProps) {
  return (
    <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="px-8 py-4 flex items-center gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[17px] font-semibold tracking-tight text-foreground truncate">
              {title}
            </h1>
            {context}
          </div>
          {subtitle && (
            <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts, keywords…"
              className="h-9 w-64 pl-8 text-[13px] bg-secondary/60 border-border"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[13px]" onClick={() => toast.info("Advanced filtering will be available in the next release.")}>
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
          {actions}
          <div className="ml-2 pl-4 border-l border-border flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </div>
  );
}
