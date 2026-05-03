import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { GigCard } from "@/components/GigCard";
import { HeroBridge } from "@/assets/illustrations";
import { fetchProfileMap } from "@/lib/profileMaps";
import { Briefcase, Send, Wallet, CheckCircle2, ArrowRight, Sparkles, GraduationCap } from "lucide-react";
import { formatPKR } from "@/lib/payments";

const StudentHome = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ active: 0, applications: 0, pending: 0, completed: 0, lifetime: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRes, hiresRes, appsRes, gigsRes] = await Promise.all([
        supabase.from("profiles").select("full_name, skills, university").eq("user_id", user.id).maybeSingle(),
        supabase.from("hires").select("id, status, gigs(title), payments(gig_amount, status, paid_to_student_at)").eq("student_id", user.id).order("created_at", { ascending: false }),
        supabase.from("applications").select("id").eq("student_id", user.id),
        supabase.from("gigs").select("id, title, category, description, budget, deadline, location, required_skills, business_id").eq("status", "open").order("created_at", { ascending: false }).limit(40),
      ]);
      const h = hiresRes.data || [];
      const lifetime = h.reduce((sum, r: any) => {
        const status = r?.payments?.status;
        const amount = parseFloat(r?.payments?.gig_amount || "0");
        return status === "paid" ? sum + (isNaN(amount) ? 0 : amount) : sum;
      }, 0);
      setProfile(profileRes.data);
      setStats({
        active: h.filter((x: any) => ["payment_received", "in_progress", "submitted", "revision_requested"].includes(x.status)).length,
        applications: appsRes.data?.length || 0,
        pending: h.filter((x: any) => x.status === "payout_pending" || x.status === "approved").length,
        completed: h.filter((x: any) => x.status === "paid").length,
        lifetime,
      });
      setRecent(h.slice(0, 5));

      const skills = (profileRes.data?.skills || []).map((s: string) => s.toLowerCase());
      const gigRows = gigsRes.data || [];
      const profileMap = await fetchProfileMap(gigRows.map((g: any) => g.business_id), "company_name");
      const all = gigRows.map((g: any) => ({ ...g, company_name: profileMap.get(g.business_id)?.company_name || null }));
      const matchScore = (g: any) => {
        const required = (g.required_skills || []).map((s: string) => s.toLowerCase());
        const overlap = required.filter((s: string) => skills.includes(s)).length;
        return overlap;
      };
      const sorted = [...all].sort((a, b) => matchScore(b) - matchScore(a) || (new Date(b.deadline || 0).getTime() - new Date(a.deadline || 0).getTime()));
      setRecommended(sorted.slice(0, 6));
      setLoading(false);
    })();
  }, [user]);

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <Card className="overflow-hidden rounded-2xl border-border/60 bg-gradient-warm">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-0">
          <div className="p-6 md:p-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />Welcome back
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-secondary leading-tight">Hi {firstName} — let's find your next gig.</h1>
            {profile?.university && (
              <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-primary" />{profile.university}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild className="rounded-full"><Link to="/student/gigs">Browse gigs <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" className="rounded-full"><Link to="/student/profile">Polish profile</Link></Button>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3">
              <MiniStat label="Lifetime earned" value={formatPKR(stats.lifetime)} accent="primary" />
              <MiniStat label="Active gigs" value={String(stats.active)} accent="accent" />
              <MiniStat label="Applications" value={String(stats.applications)} accent="secondary" />
            </div>
          </div>
          <div className="relative bg-card border-l border-border/60 hidden md:flex items-center justify-center p-4">
            <HeroBridge className="w-full max-w-[420px] h-auto" />
          </div>
        </div>
      </Card>

      {/* Recommended gigs */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-secondary">Recommended for you</h2>
            <p className="text-sm text-muted-foreground">Sorted by your saved skills.</p>
          </div>
          <Button asChild size="sm" variant="ghost"><Link to="/student/gigs">See all <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Card key={i} className="h-48 rounded-2xl animate-pulse bg-muted/40" />)}
          </div>
        ) : recommended.length === 0 ? (
          <Card className="p-8 rounded-2xl text-center text-muted-foreground">
            No gigs yet. Check back soon — businesses post daily.
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.slice(0, 3).map((g) => (
              <GigCard key={g.id} gig={g} to={`/student/gigs/${g.id}`} compact />
            ))}
          </div>
        )}
      </section>

      {/* Recent work + tips */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <Card className="p-6 rounded-2xl border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />Recent work</h2>
            <Button asChild size="sm" variant="ghost"><Link to="/student/active">All work <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="mb-4">No active work yet. Find your first gig!</p>
              <Button asChild><Link to="/student/gigs">Browse Gigs</Link></Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition-smooth">
                  <div className="font-medium truncate mr-3">{h.gigs?.title}</div>
                  <StatusBadge status={h.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 rounded-2xl border-accent/40 bg-accent/10 space-y-4">
          <div className="flex items-center gap-2 text-accent-foreground"><Wallet className="h-4 w-4" /><h3 className="font-semibold">Pro tips</h3></div>
          <Tip icon={Send} text="Keep your application short and specific. Mention 1–2 relevant projects, then your availability." />
          <Tip icon={CheckCircle2} text="Add your bank or Easypaisa in Profile so payouts can land instantly when work is approved." />
          <Tip icon={Sparkles} text="Up to 4 skill chips appear on your applicant card — pick the ones businesses care about." />
        </Card>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, accent }: { label: string; value: string; accent: "primary" | "accent" | "secondary" }) => {
  const styles: Record<string, string> = {
    primary: "border-primary/30 bg-primary-soft/40",
    accent: "border-accent/40 bg-accent/15",
    secondary: "border-secondary/20 bg-secondary/5",
  };
  return (
    <div className={`rounded-xl border p-3 ${styles[accent]}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="font-display text-lg font-bold text-secondary truncate">{value}</div>
    </div>
  );
};

const Tip = ({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) => (
  <div className="flex gap-3">
    <div className="h-8 w-8 grid place-items-center rounded-lg bg-card shadow-card shrink-0"><Icon className="h-4 w-4 text-accent-foreground" /></div>
    <p className="text-sm text-foreground/85">{text}</p>
  </div>
);

export default StudentHome;
