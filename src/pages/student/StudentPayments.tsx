import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingPrompt } from "@/components/RatingPrompt";
import { formatPKR } from "@/lib/payments";
import { fetchProfileMap } from "@/lib/profileMaps";
import { toast } from "sonner";
import { Star } from "lucide-react";

const StudentPayments = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [ratingTarget, setRatingTarget] = useState<{ hireId: string; revieweeId: string; revieweeName: string } | null>(null);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("hires")
      .select("id, status, business_id, gigs(title), payments(gig_amount, status, paid_to_student_at)")
      .eq("student_id", user.id);
    if (error) toast.error(error.message);
    const profileMap = await fetchProfileMap((data || []).map((r: any) => r.business_id), "company_name, full_name");
    setRows((data || []).map((r: any) => ({ ...r, profiles: profileMap.get(r.business_id) || null })));

    // Check which paid hires already have a review from this student
    const paidIds = (data || []).filter((r: any) => r.status === "paid").map((r: any) => r.id);
    if (paidIds.length > 0) {
      const { data: existing } = await supabase.from("reviews").select("hire_id").eq("reviewer_id", user.id).in("hire_id", paidIds);
      setReviewed(new Set((existing || []).map((r: any) => r.hire_id)));
    }
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Payments</h1>
        <p className="text-muted-foreground">Track your earnings and payouts.</p>
      </div>
      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gig</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid on</TableHead>
              <TableHead className="text-right">Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments yet.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.gigs?.title}</TableCell>
                <TableCell>{r.payments?.gig_amount ? formatPKR(r.payments.gig_amount) : "—"}</TableCell>
                <TableCell><StatusBadge status={r.payments?.status || r.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.payments?.paid_to_student_at ? new Date(r.payments.paid_to_student_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-right">
                  {r.status === "paid" && !reviewed.has(r.id) && (
                    <Button size="sm" variant="outline" onClick={() => setRatingTarget({
                      hireId: r.id,
                      revieweeId: r.business_id,
                      revieweeName: r.profiles?.company_name || r.profiles?.full_name || "Business",
                    })}>
                      <Star className="h-3.5 w-3.5 mr-1" />Rate business
                    </Button>
                  )}
                  {r.status === "paid" && reviewed.has(r.id) && (
                    <span className="text-xs text-muted-foreground">Reviewed ✓</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {ratingTarget && (
        <RatingPrompt
          hireId={ratingTarget.hireId}
          revieweeId={ratingTarget.revieweeId}
          revieweeName={ratingTarget.revieweeName}
          reviewerRole="student"
          open={!!ratingTarget}
          onClose={() => { setRatingTarget(null); load(); }}
        />
      )}
    </div>
  );
};
export default StudentPayments;
