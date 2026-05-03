import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { GigCard } from "@/components/GigCard";
import { HeroBridge } from "@/assets/illustrations";
import {
  GraduationCap, Briefcase, ShieldCheck, BadgeCheck, Wallet, Send, FileCheck2,
  UserPlus, FileSearch, ListChecks, Users, ArrowRight, Sparkles, Receipt, Quote
} from "lucide-react";
import { formatPKR } from "@/lib/payments";
import { fetchProfileMap } from "@/lib/profileMaps";

type FeaturedGig = {
  id: string;
  title: string;
  category: string | null;
  description: string;
  budget: number | string;
  deadline: string | null;
  location: string;
  required_skills: string[] | null;
  business_id: string;
  company_name?: string | null;
};

type StatLine = { paid: number; students: number; completed: number };

const universities = [
  "IBA Karachi", "LUMS", "NUST Islamabad", "FAST NUCES", "Habib University",
  "GIKI", "NED University", "University of Karachi", "Punjab University", "COMSATS",
];

const TESTIMONIALS = [
  { quote: "I shipped my first paid project in week one. Payments hit my Easypaisa within a day of approval.", name: "Hassan A.", role: "CS student, LUMS" },
  { quote: "We hire interns through Gig Bridge instead of LinkedIn — better signal, faster hiring.", name: "Sundas N.", role: "Founder, ByteBazaar" },
  { quote: "The escrow flow makes it easy to trust new clients. I focus on the work, not the chasing.", name: "Zara M.", role: "Designer, Habib University" },
];

const Landing = () => {
  const [featured, setFeatured] = useState<FeaturedGig[]>([]);
  const [stats, setStats] = useState<StatLine>({ paid: 0, students: 0, completed: 0 });

  useEffect(() => {
    (async () => {
      const [gigsRes, paidRes, studentRolesRes, completedRes] = await Promise.all([
        supabase.from("gigs").select("id, title, category, description, budget, deadline, location, required_skills, business_id").eq("status", "open").order("created_at", { ascending: false }).limit(6),
        supabase.from("payments").select("gig_amount").eq("status", "paid"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("hires").select("id", { count: "exact", head: true }).eq("status", "paid"),
      ]);
      const gigRows = gigsRes.data || [];
      const profileMap = await fetchProfileMap(gigRows.map((g: any) => g.business_id), "company_name");
      setFeatured(gigRows.map((g: any) => ({ ...g, company_name: profileMap.get(g.business_id)?.company_name || null })));
      const paid = (paidRes.data || []).reduce((s: number, p: any) => s + parseFloat(p.gig_amount || "0"), 0);
      setStats({
        paid,
        students: studentRolesRes.count || 0,
        completed: completedRes.count || 0,
      });
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background bridge-pattern">
      {/* Nav */}
      <header className="container flex items-center justify-between py-5">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/80">
          <a href="#how" className="hover:text-primary transition-colors">How it works</a>
          <a href="#featured" className="hover:text-primary transition-colors">Find Gigs</a>
          <a href="#hire" className="hover:text-primary transition-colors">Hire Students</a>
          <Link to="/auth" className="hover:text-primary transition-colors">Login</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/auth">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/auth?mode=signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container grid lg:grid-cols-2 gap-12 items-center pt-8 pb-20 md:pt-16 md:pb-28">
        <div className="space-y-7 animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Built for Pakistani students
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] text-secondary">
            Where Pakistani students meet <span className="text-primary">real opportunities</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Short-term gigs, micro-jobs, tuition work, and student-friendly freelance projects. Apply, deliver, and get paid — protected by Gig Bridge.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/auth?mode=signup&role=student"><GraduationCap className="mr-2 h-5 w-5" />I'm a Student</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link to="/auth?mode=signup&role=business"><Briefcase className="mr-2 h-5 w-5" />I'm Hiring</Link>
            </Button>
          </div>
          <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-success" />Payment protected</div>
            <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-success" />Easypaisa & bank payouts</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-8 -right-4 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <Card className="relative overflow-hidden rounded-2xl border-border/60 shadow-lift bg-card p-4">
            <HeroBridge className="w-full h-auto" />
          </Card>
          <div className="absolute -bottom-4 left-6 bg-card border rounded-xl shadow-card p-3 flex items-center gap-3 animate-float">
            <div className="h-9 w-9 rounded-lg bg-success/15 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Payment</div>
              <div className="text-sm font-semibold">Protected by escrow</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container">
        <Card className="rounded-2xl border-border/60 p-6 md:p-8 shadow-card grid grid-cols-3 gap-4 text-center">
          <Stat label="Paid out to students" value={formatPKR(stats.paid)} icon={Receipt} accent="primary" />
          <Stat label="Students earning" value={stats.students.toLocaleString()} icon={GraduationCap} accent="accent" />
          <Stat label="Gigs completed" value={stats.completed.toLocaleString()} icon={CheckCircleIcon} accent="success" />
        </Card>
      </section>

      {/* Featured gigs */}
      {featured.length > 0 && (
        <section id="featured" className="container py-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-secondary">Live gigs</h2>
              <p className="text-muted-foreground mt-2">A peek at what's being posted right now.</p>
            </div>
            <Button asChild variant="ghost"><Link to="/auth?mode=signup&role=student">See all <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((g) => (
              <GigCard key={g.id} gig={g} to={`/auth?mode=signup&role=student`} ctaLabel="Sign in to apply" compact />
            ))}
          </div>
        </section>
      )}

      {/* University wall */}
      <section className="container py-10">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-4">Trusted by students from</div>
        <div className="overflow-hidden">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-semibold text-secondary/70">
            {universities.map((u) => (
              <span key={u} className="hover:text-secondary transition-colors">{u}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-20">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-secondary">How it works</h2>
          <p className="text-muted-foreground mt-3">A simple, safe flow for both sides.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2"><GraduationCap className="h-5 w-5" />For Students</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: UserPlus, title: "Create profile", text: "Add your university, skills, portfolio." },
                { icon: FileSearch, title: "Apply for gigs", text: "Browse work that fits your schedule." },
                { icon: FileCheck2, title: "Submit & get paid", text: "Deliver, get approved, get paid." },
              ].map((s, i) => (
                <Card key={i} className="p-5 rounded-2xl border-border/60 shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-smooth bg-card">
                  <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center mb-3">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-xs text-accent font-bold mb-1">STEP {i + 1}</div>
                  <div className="font-semibold mb-1">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.text}</div>
                </Card>
              ))}
            </div>
          </div>

          <div id="hire">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5" />For Businesses</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Send, title: "Post a gig", text: "Tell us your project and budget." },
                { icon: Users, title: "Review students", text: "Pick the best applicant." },
                { icon: ListChecks, title: "Approve & release", text: "Pay only when you're happy." },
              ].map((s, i) => (
                <Card key={i} className="p-5 rounded-2xl border-border/60 shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-smooth bg-card">
                  <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center mb-3">
                    <s.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="text-xs text-accent font-bold mb-1">STEP {i + 1}</div>
                  <div className="font-semibold mb-1">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.text}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-secondary">Loved by both sides</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="p-6 rounded-2xl border-border/60 shadow-card relative">
              <Quote className="absolute right-5 top-5 h-6 w-6 text-primary/15" />
              <p className="text-foreground/85 mb-4">{t.quote}</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-soft text-primary font-display font-bold grid place-items-center">{t.name.charAt(0)}</div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="container py-16">
        <Card className="rounded-2xl bg-gradient-brand text-primary-foreground p-10 md:p-14 shadow-lift border-0 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center relative">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold mb-3">
                <Sparkles className="h-3.5 w-3.5" /> Free to start
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-2">Ready to start earning?</h3>
              <p className="opacity-90 text-primary-foreground/85">Join Gig Bridge today — students keep 100% of the gig amount.</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link to="/auth?mode=signup&role=student">Create your profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>
      </section>

      <footer className="container py-10 border-t border-border/60 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo />
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <a href="#how" className="hover:text-primary">How it works</a>
            <Link to="/auth" className="hover:text-primary">Sign in</Link>
            <Link to="/admin/login" className="text-xs opacity-70 hover:opacity-100 hover:text-primary transition-smooth">Admin</Link>
          </div>
          <div>© {new Date().getFullYear()} Gig Bridge. Built with care in Pakistan.</div>
        </div>
      </footer>
    </div>
  );
};

const Stat = ({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: "primary" | "accent" | "success" }) => {
  const styles: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent/20 text-accent-foreground",
    success: "bg-success/15 text-success",
  };
  return (
    <div className="space-y-2">
      <div className={`mx-auto h-10 w-10 rounded-xl grid place-items-center ${styles[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-2xl md:text-3xl font-bold text-secondary">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
    </div>
  );
};

// Inline checkmark icon (lucide-react's CheckCircle2 already used; we want a circular variant for the stats)
const CheckCircleIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Landing;
