import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, Bell, Settings, Activity, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/clerk-react";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/feed", label: "Live Feed", icon: Activity },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/insights", label: "Insights", icon: LineChart },
];

export function Sidebar() {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useUser();

  return (
    <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src="/swasthyapulse_logo.png"
              alt="SwasthyaPulse Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
              SwasthyaPulse
            </span>
            <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground mt-0.5">
              Health Listening
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {navItems.map((item) => {
          const active = item.exact ? path === item.to : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
        >
          <Settings className="h-4 w-4" strokeWidth={2} />
          Settings
        </Link>
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-2 rounded-md bg-sidebar-accent/40">
          <div className="h-7 w-7 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center text-xs font-semibold overflow-hidden">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName || ""} className="h-full w-full object-cover" />
            ) : (
              user?.firstName?.charAt(0) || "U"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || "User"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
