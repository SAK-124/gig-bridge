import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Wallet } from "lucide-react";
import { formatPKR } from "@/lib/payments";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

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
}

const BrowseGigs = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("gigs").select("*").eq("status", "open").order("created_at", { ascending: false }).then(({ data }) => {
      setGigs((data as Gig[]) || []);
      setLoading(false);
    });
  }, []);

  const filtered = gigs.filter((g) =>
    !q || g.title.toLowerCase().includes(q.toLowerCase()) || g.description.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Browse gigs</h1>
        <p className="text-muted-foreground">Find work that fits your schedule.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search gigs..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground rounded-2xl">No gigs match your search.</Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((g) => (
            <Card key={g.id} className="p-5 rounded-2xl border-border/60 hover:shadow-lift transition-smooth">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg leading-tight">{g.title}</h3>
                <span className="font-display text-lg text-primary font-bold whitespace-nowrap">{formatPKR(g.budget)}</span>
              </div>
              {g.category && <Badge variant="secondary" className="mb-3">{g.category}</Badge>}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{g.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{g.location}</span>
                {g.deadline && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(g.deadline).toLocaleDateString()}</span>}
              </div>
              {g.required_skills && g.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {g.required_skills.slice(0, 4).map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
              )}
              <Button asChild className="w-full"><Link to={`/student/gigs/${g.id}`}>View & apply</Link></Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseGigs;
