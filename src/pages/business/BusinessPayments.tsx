import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentProofViewer } from "@/components/PaymentProofViewer";
import { EmptyState } from "@/components/EmptyState";
import { RatingPrompt } from "@/components/RatingPrompt";
import { PaymentShield } from "@/assets/illustrations";
import { formatPKR, paymentDisplayStatus } from "@/lib/payments";
import { ArrowRight, ReceiptText, Star } from "lucide-react";

const BusinessPayments = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [ratingTarget, setRatingTarget] = useState<{ hireId: string; revieweeId: string; revieweeName: string } | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("hires")
      .select("id, status, student_id, gigs(title), profiles:student_id(full_name), payments(id, gig_amount, platform_fee, total_amount, status, business_proof_url, admin_payout_proof_url)")
      .eq("business_id", user.id)
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);

    const paidIds = (data || []).filter((r: any) => r.status === "paid").map((r: any) => r.id);
    if (paidIds.length > 0) {
      const { data: existing } = await supabase.from("reviews").select("hire_id").eq("reviewer_id", user.id).in("hire_id", paidIds);
      setReviewed(new Set((existing || []).map((r: any) => r.hire_id)));
    }
  };

  useEffect(() => { load(); }, [user]);

  const empty = !loading && rows.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Payments</h1>
        <p className="text-muted-foreground">Bank-transfer escrow. Upload your transfer screenshot and the admin will verify it.</p>
      </div>

      {empty ? (
        <EmptyState
          illustration={<PaymentShield className="w-full" />}
          title="No payments yet"
          description="When you hire a student, the escrow record will appear here."
          ctaLabel="Browse applicants"
          ctaTo="/business/applicants"
        />
      ) : (
        <Card className="rounded-2xl border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gig</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const p = r.payments;
                const display = p ? paymentDisplayStatus(p.status, !!p.business_proof_url) : "awaiting_proof";
                const needsAction = display === "awaiting_proof" || display === "awaiting_verification";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.gigs?.title}</TableCell>
                    <TableCell className="text-sm">{r.profiles?.full_name || "—"}</TableCell>
                    <TableCell>{p?.gig_amount ? formatPKR(p.gig_amount) : "—"}</TableCell>
                    <TableCell>{p?.platform_fee ? formatPKR(p.platform_fee) : "—"}</TableCell>
                    <TableCell className="font-semibold">{p?.total_amount ? formatPKR(p.total_amount) : "—"}</TableCell>
                    <TableCell><StatusBadge status={display} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {p?.business_proof_url && <PaymentProofViewer path={p.business_proof_url} label="My proof" />}
                        {p?.admin_payout_proof_url && <PaymentProofViewer path={p.admin_payout_proof_url} label="Payout proof" variant="ghost" />}
                        {needsAction && (
                          <Button asChild size="sm">
                            <Link to={`/business/payments/${r.id}/transfer`}>
                              <ReceiptText className="h-3.5 w-3.5 mr-1" />
                              {display === "awaiting_proof" ? "Send transfer" : "View status"}
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                          </Button>
                        )}
                        {r.status === "paid" && !reviewed.has(r.id) && (
                          <Button size="sm" variant="outline" onClick={() => setRatingTarget({
                            hireId: r.id,
                            revieweeId: r.student_id,
                            revieweeName: r.profiles?.full_name || "Student",
                          })}>
                            <Star className="h-3.5 w-3.5 mr-1" />Rate
                          </Button>
                        )}
                        {r.status === "paid" && reviewed.has(r.id) && (
                          <span className="text-xs text-muted-foreground">Reviewed ✓</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {ratingTarget && (
        <RatingPrompt
          hireId={ratingTarget.hireId}
          revieweeId={ratingTarget.revieweeId}
          revieweeName={ratingTarget.revieweeName}
          reviewerRole="business"
          open={!!ratingTarget}
          onClose={() => { setRatingTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default BusinessPayments;
