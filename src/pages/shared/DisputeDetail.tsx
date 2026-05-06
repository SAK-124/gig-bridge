import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HireChat } from "@/components/HireChat";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPKR } from "@/lib/payments";
import { Loader2, ShieldCheck, Lock, ExternalLink, Package, CheckSquare } from "lucide-react";

const resolutionLabel: Record<string, string> = {
  release: "Payment released to student",
  refund: "Payment refunded to business",
  revision: "Revision requested — student to resubmit",
};

const statusLabel: Record<string, string> = {
  open: "Open — under review",
  reviewing: "Admin reviewing",
  resolved: "Resolved",
};

const DisputeDetail = () => {
  const { hireId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hire, setHire] = useState<any>(null);
  const [dispute, setDispute] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hireId) return;
    (async () => {
      const [hireRes, disputeRes, subRes] = await Promise.all([
        supabase.from("hires").select("id, status, gigs(title, description, deliverables, acceptance_criteria, budget), profiles:student_id(full_name), business:business_id(company_name, full_name), payments(id, status, total_amount, gig_amount)").eq("id", hireId).maybeSingle(),
        supabase.from("disputes").select("*").eq("hire_id", hireId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("submissions").select("*").eq("hire_id", hireId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setHire(hireRes.data);
      setDispute(disputeRes.data);
      setSubmission(subRes.data);
      setLoading(false);
    })();
  }, [hireId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;
  if (!hire) return <Card className="p-12 text-center rounded-2xl">Hire not found.</Card>;

  const gig = hire.gigs;
  const payment = Array.isArray(hire.payments) ? hire.payments[0] : hire.payments;

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>

      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">Dispute — {gig?.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {hire.profiles?.full_name} · {hire.business?.company_name || hire.business?.full_name}
          </p>
        </div>
        {payment?.total_amount && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Escrowed amount</div>
            <div className="font-display text-xl text-primary font-bold">{formatPKR(payment.total_amount)}</div>
          </div>
        )}
      </div>

      {/* Dispute status */}
      {dispute && (
        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="font-semibold">Dispute status</div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              dispute.status === "resolved" ? "bg-success/15 text-success" :
              dispute.status === "reviewing" ? "bg-warning/15 text-warning-foreground" :
              "bg-primary/15 text-primary"
            }`}>
              {statusLabel[dispute.status] || dispute.status}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Raised by</div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dispute.raised_by_role === "business" ? "bg-accent/20 text-accent-foreground" : "bg-primary/15 text-primary"}`}>
              {dispute.raised_by_role}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Reason</div>
            <div className="bg-muted/40 rounded-xl p-3 text-sm">{dispute.reason}</div>
          </div>
          {dispute.admin_notes && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Admin notes</div>
              <div className="bg-muted/40 rounded-xl p-3 text-sm">{dispute.admin_notes}</div>
            </div>
          )}
          {dispute.status === "resolved" && dispute.resolution && (
            <div className="bg-success/10 rounded-xl p-3 text-sm font-medium text-success">
              ✓ {resolutionLabel[dispute.resolution] || dispute.resolution}
            </div>
          )}
        </Card>
      )}

      {/* Gig Brief */}
      <Card className="p-5 rounded-2xl border-border/60 space-y-4">
        <h2 className="font-semibold text-lg">Gig brief</h2>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{gig?.description}</p>
        </div>
        {gig?.deliverables && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />Deliverables</div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{gig.deliverables}</p>
          </div>
        )}
        {gig?.acceptance_criteria && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><CheckSquare className="h-3.5 w-3.5" />Acceptance criteria</div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{gig.acceptance_criteria}</p>
          </div>
        )}
      </Card>

      {/* Submitted work */}
      {submission && (
        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <h2 className="font-semibold text-lg">Submitted work</h2>
          <p className="text-sm whitespace-pre-wrap">{submission.message}</p>
          {submission.link_url && (
            <a href={submission.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-4 w-4" />{submission.link_url}
            </a>
          )}
          {submission.file_url && (
            <a href={submission.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-4 w-4" />Submitted file
            </a>
          )}
          <div className="text-xs text-muted-foreground">Submitted {new Date(submission.created_at).toLocaleString()}</div>
        </Card>
      )}

      {/* Evidence */}
      {dispute?.evidence_urls?.length > 0 && (
        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <h2 className="font-semibold text-lg">Evidence</h2>
          <div className="flex flex-wrap gap-3">
            {dispute.evidence_urls.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline bg-muted/40 rounded-lg px-3 py-2">
                <ExternalLink className="h-4 w-4" />Evidence {i + 1}
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Chat history */}
      <Card className="p-5 rounded-2xl border-border/60">
        <h2 className="font-semibold text-lg mb-4">Chat history</h2>
        <HireChat hireId={hire.id} readonly={dispute?.status === "resolved"} />
      </Card>

      {/* Dispute policy */}
      <Card className="p-5 rounded-2xl border-primary/20 bg-primary-soft/30 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-primary">Payment protected by Gig Bridge</span>
          <Lock className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-foreground/75">
          Gig Bridge protects both sides. Employers fund the gig before work starts. Students are paid when the agreed deliverables are submitted and approved. If there is a disagreement, Gig Bridge reviews the original gig brief, submitted work, chat history, and evidence from both sides. Payment may be released, refunded, or sent back for revision depending on whether the agreed scope was completed.
        </p>
      </Card>
    </div>
  );
};

export default DisputeDetail;
