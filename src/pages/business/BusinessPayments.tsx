import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPKR } from "@/lib/payments";

const BusinessPayments = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("hires").select("id, gigs(title), payments(gig_amount, platform_fee, total_amount, status, shopify_checkout_url)").eq("business_id", user.id).then(({ data }) => setRows(data || []));
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Payments</h1>
        <p className="text-muted-foreground">All payments you've made through Gig Bridge.</p>
      </div>
      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gig</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments yet.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.gigs?.title}</TableCell>
                <TableCell>{r.payments?.gig_amount ? formatPKR(r.payments.gig_amount) : "—"}</TableCell>
                <TableCell>{r.payments?.platform_fee ? formatPKR(r.payments.platform_fee) : "—"}</TableCell>
                <TableCell className="font-semibold">{r.payments?.total_amount ? formatPKR(r.payments.total_amount) : "—"}</TableCell>
                <TableCell>
                  {r.payments?.shopify_checkout_url && r.payments?.status === "awaiting" ? (
                    <a href={r.payments.shopify_checkout_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">Pay now →</a>
                  ) : <StatusBadge status={r.payments?.status || "awaiting"} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
export default BusinessPayments;
