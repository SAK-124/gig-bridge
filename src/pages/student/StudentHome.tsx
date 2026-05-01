import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Briefcase, Send, Wallet, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPKR } from "@/lib/payments";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const StudentHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, applications: 0, pending: 0, completed: 0 });
  const [recent, setRecent] = useState<Array<{ id: string; gigs: { title: string }; status: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [hires, apps] = await Promise.all([
        supabase.from("hires").select("id, status, gigs(title)").eq("student_id", user.id),
        supabase.from("applications").select("id").eq("student_id", user.id),
      ]);
      const h = hires.data || [];
      setStats({
        active: h.filter((x) => ["payment_received", "in_progress", "submitted", "revision_requested"].includes(x.status)).length,
        applications: apps.data?.length || 0,
        pending: h.filter((x) => x.status === "payout_pending" || x.status === "approved").length,
        completed: h.filter((x) => x.status === "paid").length,
      });
      setRecent(h.slice(0, 5) as never);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Welcome back 👋</h1>
        <p className="text-muted-foreground">Here's what's happening with your gigs.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active gigs" value={stats.active} icon={Briefcase} loading={loading} />
        <StatCard label="Applications sent" value={stats.applications} icon={Send} loading={loading} />
        <StatCard label="Pending payments" value={stats.pending} icon={Wallet} loading={loading} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} loading={loading} />
      </div>

      <Card className="p-6 rounded-2xl border-border/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent work</h2>
          <Button asChild size="sm" variant="ghost"><Link to="/student/gigs">Browse gigs</Link></Button>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No active work yet. Find your first gig!</p>
            <Button asChild><Link to="/student/gigs">Browse Gigs</Link></Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition-smooth">
                <div className="font-medium">{h.gigs?.title}</div>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentHome;
