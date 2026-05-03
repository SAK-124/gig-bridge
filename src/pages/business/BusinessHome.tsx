import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { Briefcase, Users, Wallet, CheckCircle2, ArrowRight, Plus, Send, AlertCircle } from "lucide-react";
import { formatPKR, paymentDisplayStatus } from "@/lib/payments";
import { fetchProfileMap } from "@/lib/profileMaps";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  in_flight: "hsl(var(--primary))",
  awaiting: "hsl(var(--warning))",
  payout_pending: "hsl(var(--accent))",
  paid: "hsl(var(--success))",
  disputed: "hsl(var(--destructive))",
};

const BusinessHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ open: 0, applicants: 0, active: 0, completed: 0, spend: 0, awaitingProof: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [topApplicants, setTopApplicants] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<{ name: string; value: number; key: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: gigs } = await supabase
        .from("gigs")
        .select("id, title, status, created_at, slots, budget")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false });
      const ids = (gigs || []).map((g: any) => g.id);

      const [appsRes, hiresRes, paymentsRes] = await Promise.all([
        ids.length
          ? supabase.from("applications").select("id, status, created_at, gig_id, student_id").in("gig_id", ids).order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as any[] }),
        supabase.from("hires").select("id, status, gig_id").eq("business_id", user.id),
        supabase.from("payments").select("status, gig_amount, total_amount, business_proof_url, hires!inner(business_id)").eq("hires.business_id", user.id),
      ]);

      const rawApps = appsRes.data || [];
      const appProfileMap = await fetchProfileMap(rawApps.map((a: any) => a.student_id), "full_name, university");
      const apps = rawApps.map((a: any) => ({ ...a, profiles: appProfileMap.get(a.student_id) || null }));
      const hires = hiresRes.data || [];
      const payments = paymentsRes.data || [];

      const spend = payments
        .filter((p: any) => ["received", "payout_pending", "paid"].includes(p.status))
        .reduce((sum: number, p: any) => sum + parseFloat(p.total_amount || "0"), 0);

      const awaitingProof = payments.filter((p: any) => p.status === "awaiting" && !p.business_proof_url).length;

      setStats({
        open: (gigs || []).filter((g: any) => g.status === "open").length,
        applicants: apps.length,
        active: hires.filter((h: any) => ["payment_received", "in_progress", "submitted"].includes(h.status)).length,
        completed: hires.filter((h: any) => h.status === "paid").length,
        spend,
        awaitingProof,
      });
      setRecent((gigs || []).slice(0, 5));
      setTopApplicants(apps.filter((a: any) => a.status === "pending" || a.status === "shortlisted").slice(0, 5));

      const buckets: Record<string, number> = { in_flight: 0, awaiting: 0, payout_pending: 0, paid: 0, disputed: 0 };
      payments.forEach((p: any) => {
        const display = paymentDisplayStatus(p.status, !!p.business_proof_url);
        if (display === "received") buckets.in_flight += 1;
        else if (display === "awaiting_proof" || display === "awaiting_verification") buckets.awaiting += 1;
        else if (display === "payout_pending") buckets.payout_pending += 1;
        else if (display === "paid") buckets.paid += 1;
        else if (display === "disputed") buckets.disputed += 1;
      });
      setPaymentBreakdown([
        { name: "Held / in flight", value: buckets.in_flight, key: "in_flight" },
        { name: "Awaiting transfer", value: buckets.awaiting, key: "awaiting" },
        { name: "Payout pending", value: buckets.payout_pending, key: "payout_pending" },
        { name: "Paid out", value: buckets.paid, key: "paid" },
        { name: "Disputed", value: buckets.disputed, key: "disputed" },
      ].filter((b) => b.value > 0));

      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-secondary">Business dashboard</h1>
          <p className="text-muted-foreground">Manage your gigs, hires, and escrow at a glance.</p>
        </div>
        <Button asChild className="rounded-full"><Link to="/business/post"><Plus className="h-4 w-4 mr-1" />Post a gig</Link></Button>
      </div>

      {stats.awaitingProof > 0 && (
        <Card className="p-4 rounded-2xl border-warning/40 bg-warning/10 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-sm">{stats.awaitingProof} hire{stats.awaitingProof > 1 ? "s" : ""} awaiting your transfer screenshot</div>
            <p className="text-xs text-muted-foreground">Send the bank transfer and upload proof so the student can start work.</p>
          </div>
          <Button asChild size="sm" variant="outline"><Link to="/business/payments">Open payments</Link></Button>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI label="Open gigs" value={stats.open} icon={Briefcase} hint="Visible to students" />
        <KPI label="Applicants" value={stats.applicants} icon={Users} hint="Across all gigs" />
        <KPI label="Active hires" value={stats.active} icon={Send} hint="In progress / submitted" />
        <KPI label="Completed" value={stats.completed} icon={CheckCircle2} hint="Fully paid out" />
        <KPI label="Total spend" value={formatPKR(stats.spend)} icon={Wallet} hint="Inc. 10% platform fee" />
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <Card className="rounded-2xl border-border/60 overflow-hidden">
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Applicants needing review</h2>
            <Button asChild size="sm" variant="ghost"><Link to="/business/applicants">All applicants <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
          </div>
          {topApplicants.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              {loading ? "Loading…" : "Nothing waiting on you. New applicants will pop up here."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topApplicants.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.profiles?.full_name || "Student"}</TableCell>
                    <TableCell className="text-sm">{a.profiles?.university || "—"}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="rounded-2xl border-border/60 p-5">
          <h2 className="font-semibold text-lg mb-3">Payment status</h2>
          {paymentBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet. Hire a student to start the escrow flow.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentBreakdown} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                    {paymentBreakdown.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {paymentBreakdown.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {paymentBreakdown.map((b) => (
                <div key={b.key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[b.key] }} />
                    <span className="text-muted-foreground">{b.name}</span>
                  </div>
                  <span className="font-semibold">{b.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Active gigs</h2>
          <Button asChild size="sm" variant="ghost"><Link to="/business/gigs">All gigs <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
        </div>
        {recent.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <p className="mb-4">Post your first gig to start hiring students.</p>
            <Button asChild><Link to="/business/post">Post a gig</Link></Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {recent.map((g) => (
              <Link key={g.id} to={`/business/gigs/${g.id}`} className="flex items-center justify-between p-4 hover:bg-muted/40 transition-smooth gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{g.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatPKR(g.budget)} · {g.slots} slot{g.slots > 1 ? "s" : ""}</div>
                </div>
                <div className="hidden sm:block w-32"><Progress value={g.status === "completed" ? 100 : g.status === "in_progress" ? 50 : 10} /></div>
                <StatusBadge status={g.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const KPI = ({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; hint?: string }) => (
  <Card className="p-4 rounded-2xl border-border/60 shadow-card">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="h-7 w-7 rounded-lg bg-primary-soft grid place-items-center"><Icon className="h-3.5 w-3.5 text-primary" /></div>
    </div>
    <div className="font-display text-2xl font-bold text-secondary leading-none">{value}</div>
    {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
  </Card>
);

export default BusinessHome;
