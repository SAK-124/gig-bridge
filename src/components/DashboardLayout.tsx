import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUserRole, signOut, type AppRole } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

interface Props {
  items: NavItem[];
  expectedRole: AppRole;
}

const DashboardLayout = ({ items, expectedRole }: Props) => {
  const { role, loading, user } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth");
    else if (role && role !== expectedRole && role !== "admin") {
      navigate(role === "business" ? "/business" : role === "student" ? "/student" : "/");
    }
  }, [loading, user, role, expectedRole, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="p-5 border-b border-sidebar-border">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split("/").length <= 2}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Logo />
        <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
      </div>

      <main className="flex-1 md:ml-0 mt-14 md:mt-0">
        <div className="md:hidden border-b border-border bg-card overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to.split("/").length <= 2}
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                    isActive ? "bg-primary-soft text-primary" : "text-muted-foreground")
                }>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="container py-6 md:py-8 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
