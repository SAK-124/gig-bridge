import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StatCard } from "@/components/StatCard";
import { Briefcase, Users, Wallet, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";

const BusinessHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ open: 0, applicants: 0, active: 0, completed: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: gigs } = await supabase.from("gigs").select("id, title, status, created_at").eq("business_id", user.id).order("created_at", { ascending: false });
      const ids = (gigs || []).map((g) => g.id);
      const { data: appsCount } = ids.length ? await supabase.from("applications").select("id", { count: "exact" }).in("gig_id", ids) : { data: [] as any };
      const { data: hires } = await supabase.from("hires").select("status").eq("business_id", user.id);
      setStats({
        open: (gigs || []).filter((g) => g.status === "open").length,
        applicants: appsCount?.length || 0,
        active: (hires || []).filter((h) => ["payment_received", "in_progress", "submitted"].includes(h.status)).length,
        completed: (hires || []).filter((h) => h.status === "paid").length,
      });
      setRecent((gigs || []).slice(0, 5));
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-secondary">Business dashboard</h1>
          <p className="text-muted-foreground">Manage your gigs and hires.</p>
        </div>
        <Button asChild><Link to="/business/post">Post a gig</Link></Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open gigs" value={stats.open} icon={Briefcase} loading={loading} />
        <StatCard label="Applicants" value={stats.applicants} icon={Users} loading={loading} />
        <StatCard label="Active hires" value={stats.active} icon={Wallet} loading={loading} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} loading={loading} />
      </div>

      <Card className="p-6 rounded-2xl border-border/60">
        <h2 className="font-semibold text-lg mb-4">Recent gigs</h2>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">Post your first gig to start hiring students.</p>
            <Button asChild><Link to="/business/post">Post a gig</Link></Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((g) => (
              <Link key={g.id} to={`/business/gigs/${g.id}`} className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition-smooth">
                <div className="font-medium">{g.title}</div>
                <StatusBadge status={g.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
export default BusinessHome;
