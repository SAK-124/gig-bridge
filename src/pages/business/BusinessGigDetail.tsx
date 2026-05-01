import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPKR } from "@/lib/payments";
import { Calendar, Loader2, MapPin } from "lucide-react";

const BusinessGigDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [gig, setGig] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: gigRow } = await supabase.from("gigs").select("*").eq("id", id).eq("business_id", user.id).maybeSingle();
      const { data: apps } = await supabase.from("applications").select("id, status, created_at, profiles:student_id(full_name, university, skills)").eq("gig_id", id).order("created_at", { ascending: false });
      setGig(gigRow);
      setApplications(apps || []);
      setLoading(false);
    })();
  }, [id, user]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;
  if (!gig) return <Card className="p-12 rounded-2xl text-center text-muted-foreground">Gig not found.</Card>;

  return (
    <div className="space-y-6 max-w-4xl">
      <Button asChild variant="ghost" size="sm"><Link to="/business/gigs">Back to active gigs</Link></Button>
      <Card className="p-6 rounded-2xl border-border/60 space-y-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-secondary">{gig.title}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{gig.location}</span>
              {gig.deadline && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(gig.deadline).toLocaleDateString()}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold text-primary">{formatPKR(gig.budget)}</div>
            <StatusBadge status={gig.status} />
          </div>
        </div>
        {gig.category && <Badge variant="secondary">{gig.category}</Badge>}
        <p className="whitespace-pre-wrap text-foreground/85">{gig.description}</p>
        {gig.required_skills?.length > 0 && <div className="flex flex-wrap gap-1.5">{gig.required_skills.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}</div>}
        {gig.attachments?.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Attachments</div>
            {gig.attachments.map((url: string) => <a key={url} href={url} target="_blank" rel="noreferrer" className="block text-sm text-primary hover:underline">{url}</a>)}
          </div>
        )}
      </Card>
      <Card className="p-6 rounded-2xl border-border/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Applicants</h2>
          <Button asChild size="sm" variant="outline"><Link to="/business/applicants">Review all applicants</Link></Button>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-border/60 p-3">
                <div>
                  <div className="font-medium">{app.profiles?.full_name || "Student"}</div>
                  <div className="text-xs text-muted-foreground">{app.profiles?.university || "University not added"}</div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default BusinessGigDetail;
