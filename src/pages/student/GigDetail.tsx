import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BusinessProfileCard } from "@/components/BusinessProfileCard";
import { formatPKR } from "@/lib/payments";
import { MapPin, Calendar, Loader2, Users, CheckSquare, Package, Target } from "lucide-react";
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
  const [applicantCount, setApplicantCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [gigRes, countRes] = await Promise.all([
        supabase.from("gigs").select("*").eq("id", id).maybeSingle(),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("gig_id", id),
      ]);
      setGig(gigRes.data);
      setApplicantCount(countRes.count || 0);
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

  const brief = (gig.brief as Record<string, any>) || {};

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>

      {/* Business profile card */}
      {gig.business_id && (
        <BusinessProfileCard businessId={gig.business_id} currentStudentId={user?.id} />
      )}

      <Card className="p-6 md:p-8 rounded-2xl border-border/60">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <h1 className="font-display text-3xl font-bold text-secondary">{gig.title}</h1>
          <span className="font-display text-2xl text-primary font-bold">{formatPKR(gig.budget)}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
          {gig.category && <Badge variant="secondary">{gig.category}</Badge>}
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{gig.location}</span>
          {gig.deadline && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Due {new Date(gig.deadline).toLocaleDateString()}</span>}
          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{applicantCount} applicant{applicantCount !== 1 ? "s" : ""}</span>
        </div>

        <h2 className="font-semibold text-lg mb-2">Description</h2>
        <p className="text-foreground/85 whitespace-pre-wrap mb-6">{gig.description}</p>

        {/* Deliverables */}
        {gig.deliverables && (
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-2 flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Deliverables</h2>
            <p className="text-foreground/85 whitespace-pre-wrap">{gig.deliverables}</p>
          </div>
        )}

        {/* Acceptance criteria */}
        {gig.acceptance_criteria && (
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-2 flex items-center gap-2"><CheckSquare className="h-5 w-5 text-success" />What counts as complete</h2>
            <p className="text-foreground/85 whitespace-pre-wrap">{gig.acceptance_criteria}</p>
          </div>
        )}

        {/* Extended brief sections */}
        {brief.purpose && (
          <div className="mb-5">
            <h2 className="font-semibold mb-1.5 flex items-center gap-2"><Target className="h-4 w-4 text-accent-foreground" />Purpose</h2>
            <p className="text-sm text-foreground/80">{brief.purpose}</p>
          </div>
        )}
        {brief.target_audience && (
          <div className="mb-5">
            <h2 className="font-semibold mb-1.5">Target audience</h2>
            <p className="text-sm text-foreground/80">{brief.target_audience}</p>
          </div>
        )}

        {/* Scope */}
        {(brief.scope_included || brief.scope_excluded) && (
          <div className="mb-5 grid sm:grid-cols-2 gap-3">
            {brief.scope_included && (
              <div className="bg-success/10 rounded-xl p-3 text-sm">
                <div className="font-semibold text-success mb-1">✓ Included</div>
                <p className="text-foreground/80 whitespace-pre-wrap">{brief.scope_included}</p>
              </div>
            )}
            {brief.scope_excluded && (
              <div className="bg-destructive/10 rounded-xl p-3 text-sm">
                <div className="font-semibold text-destructive mb-1">✗ Not included</div>
                <p className="text-foreground/80 whitespace-pre-wrap">{brief.scope_excluded}</p>
              </div>
            )}
          </div>
        )}

        {/* Revisions */}
        {brief.revision_count !== undefined && (
          <div className="mb-5">
            <span className="text-sm"><span className="font-semibold">Revisions included:</span> {brief.revision_count}</span>
          </div>
        )}

        {/* Timeline extras */}
        {(brief.start_date || brief.milestones || brief.review_window_days) && (
          <div className="mb-5 space-y-1 text-sm">
            <h2 className="font-semibold mb-1.5">Timeline</h2>
            {brief.start_date && <div><span className="text-muted-foreground">Start:</span> {brief.start_date}</div>}
            {brief.milestones && <div><span className="text-muted-foreground">Milestones:</span> {brief.milestones}</div>}
            {brief.review_window_days && <div><span className="text-muted-foreground">Review window:</span> {brief.review_window_days} days</div>}
          </div>
        )}

        {/* Required skills */}
        {gig.required_skills?.length > 0 && (
          <>
            <h2 className="font-semibold text-lg mb-2">Required skills</h2>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {gig.required_skills.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
          </>
        )}

        {/* Experience level */}
        {brief.experience_level && (
          <div className="mb-4 text-sm"><span className="font-semibold">Experience level:</span> {brief.experience_level}</div>
        )}

        {/* Payment terms */}
        {(brief.payment_type || brief.release_condition) && (
          <div className="mb-4 text-sm">
            {brief.payment_type && <div><span className="font-semibold">Payment type:</span> {brief.payment_type}</div>}
            {brief.release_condition && <div><span className="font-semibold">Release condition:</span> {brief.release_condition}</div>}
          </div>
        )}
      </Card>

      <Card className="p-6 rounded-2xl border-border/60">
        <h2 className="font-semibold text-lg mb-3">Apply for this gig</h2>
        {alreadyApplied ? (
          <p className="text-success font-medium">✓ You've already applied to this gig.</p>
        ) : (
          <>
            <Textarea
              placeholder="Why are you a great fit? Mention relevant experience..."
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              rows={5}
              maxLength={1000}
              className="mb-4 text-base"
            />
            <Button onClick={apply} disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit application
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default GigDetail;
