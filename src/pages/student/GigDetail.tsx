import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/payments";
import { MapPin, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

const GigDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gig, setGig] = useState<any>(null);
  const [cover, setCover] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("gigs").select("*").eq("id", id).maybeSingle();
      setGig(data);
      if (user) {
        const { data: app } = await supabase.from("applications").select("id").eq("gig_id", id).eq("student_id", user.id).maybeSingle();
        setAlreadyApplied(!!app);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const apply = async () => {
    if (!user || !id) return;
    if (cover.trim().length < 20) return toast.error("Write at least 20 characters in your cover letter");
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({ gig_id: id, student_id: user.id, cover_letter: cover.trim() });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Application sent!");
    navigate("/student/applications");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;
  if (!gig) return <Card className="p-12 text-center rounded-2xl">Gig not found.</Card>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
      <Card className="p-6 md:p-8 rounded-2xl border-border/60">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <h1 className="font-display text-3xl font-bold text-secondary">{gig.title}</h1>
          <span className="font-display text-2xl text-primary font-bold">{formatPKR(gig.budget)}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-6">
          {gig.category && <Badge variant="secondary">{gig.category}</Badge>}
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{gig.location}</span>
          {gig.deadline && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Due {new Date(gig.deadline).toLocaleDateString()}</span>}
        </div>
        <h2 className="font-semibold text-lg mb-2">Description</h2>
        <p className="text-foreground/85 whitespace-pre-wrap mb-6">{gig.description}</p>
        {gig.required_skills?.length > 0 && (
          <>
            <h2 className="font-semibold text-lg mb-2">Required skills</h2>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {gig.required_skills.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
          </>
        )}
      </Card>

      <Card className="p-6 rounded-2xl border-border/60">
        <h2 className="font-semibold text-lg mb-3">Apply for this gig</h2>
        {alreadyApplied ? (
          <p className="text-success font-medium">✓ You've already applied to this gig.</p>
        ) : (
          <>
            <Textarea placeholder="Why are you a great fit? Mention relevant experience..." value={cover} onChange={(e) => setCover(e.target.value)} rows={5} maxLength={1000} className="mb-4" />
            <Button onClick={apply} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit application
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default GigDetail;
