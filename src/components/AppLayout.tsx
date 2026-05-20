import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Compass,
  MapPin,
  Route,
  Package,
  Tag as TagIcon,
  CalendarRange,
  Settings as SettingsIcon,
} from "lucide-react";
import { useSettings } from "@/lib/settings";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoUrl from "@/assets/hopon-logo.png";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/experiences", label: "Experiences", icon: Compass },
  { to: "/pois", label: "Points of interest", icon: MapPin },
  { to: "/itineraries", label: "Itineraries", icon: Route },
  { to: "/packages", label: "Packages", icon: Package },
  { to: "/tags", label: "Tags", icon: TagIcon },
  { to: "/bookings", label: "Bookings", icon: CalendarRange },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppLayout({ children, title, subtitle, actions }: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { pathname } = useLocation();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <img src={logoUrl} alt="Hop on Mobility" className="h-7 w-auto mb-3 dark:brightness-0 dark:invert" />
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hop on Mobility</div>
          <div className="font-display text-2xl mt-1">Experiences</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-sidebar-border text-xs text-muted-foreground">
          <div className="truncate">
            Owner:{" "}
            <span className="text-foreground font-mono">{settings.owner || "—"}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="px-6 md:px-10 pt-8 pb-6 border-b border-border bg-background/70 backdrop-blur sticky top-0 z-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">{actions}<ThemeToggle /></div>
          </div>
        </header>
        <div className="px-6 md:px-10 py-8">{children}</div>
      </main>
    </div>
  );
}
