import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GigCard } from "@/components/GigCard";
import { EmptyState } from "@/components/EmptyState";
import { EmptyGigs } from "@/assets/illustrations";
import { fetchProfileMap } from "@/lib/profileMaps";
import { Search } from "lucide-react";

interface Gig {
  id: string;
  title: string;
  category: string | null;
  description: string;
  budget: number;
  deadline: string | null;
  location: string;
  required_skills: string[] | null;
  business_id: string;
  company_name?: string | null;
}

const BrowseGigs = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("gigs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const rows = (data as any[]) || [];
        const profileMap = await fetchProfileMap(rows.map((g) => g.business_id), "company_name");
        setGigs(rows.map((g) => ({ ...g, company_name: profileMap.get(g.business_id)?.company_name || null })));
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    gigs.forEach((g) => g.category && set.add(g.category));
    return ["All", ...Array.from(set).sort()];
  }, [gigs]);

  const filtered = useMemo(() => {
    return gigs.filter((g) => {
      if (activeCategory !== "All" && g.category !== activeCategory) return false;
      if (!q) return true;
      const needle = q.toLowerCase();
      return (
        g.title.toLowerCase().includes(needle) ||
        g.description.toLowerCase().includes(needle) ||
        (g.required_skills || []).some((s) => s.toLowerCase().includes(needle))
      );
    });
  }, [gigs, q, activeCategory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Browse gigs</h1>
        <p className="text-muted-foreground">Find work that fits your schedule.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search title, description, or skill..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-smooth ${
                activeCategory === c
                  ? "bg-primary text-primary-foreground border-primary shadow-card"
                  : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {c}
              {c !== "All" && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px] font-medium align-middle">
                  {gigs.filter((g) => g.category === c).length}
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          illustration={<EmptyGigs className="w-full" />}
          title={gigs.length === 0 ? "No gigs posted yet" : "No gigs match your filters"}
          description={gigs.length === 0
            ? "Once businesses start posting, gigs will appear here. In the meantime, polish your profile so you stand out."
            : "Try clearing the search box or picking a different category."}
          ctaLabel={gigs.length === 0 ? "Polish profile" : "Reset filters"}
          ctaTo={gigs.length === 0 ? "/student/profile" : undefined}
          onCtaClick={gigs.length === 0 ? undefined : () => { setQ(""); setActiveCategory("All"); }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GigCard key={g.id} gig={g} to={`/student/gigs/${g.id}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseGigs;
