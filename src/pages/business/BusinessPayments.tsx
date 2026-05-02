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
import { PaymentShield } from "@/assets/illustrations";
import { formatPKR, paymentDisplayStatus } from "@/lib/payments";
import { ArrowRight, ReceiptText } from "lucide-react";

const BusinessPayments = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("hires")
      .select("id, gigs(title), payments(id, gig_amount, platform_fee, total_amount, status, business_proof_url, admin_payout_proof_url)")
      .eq("business_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setRows(data || []); setLoading(false); });
  }, [user]);

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
                    <TableCell>{p?.gig_amount ? formatPKR(p.gig_amount) : "—"}</TableCell>
                    <TableCell>{p?.platform_fee ? formatPKR(p.platform_fee) : "—"}</TableCell>
                    <TableCell className="font-semibold">{p?.total_amount ? formatPKR(p.total_amount) : "—"}</TableCell>
                    <TableCell><StatusBadge status={display} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default BusinessPayments;
