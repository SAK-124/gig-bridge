import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPKR } from "@/lib/payments";

const StudentPayments = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("hires").select("id, status, gigs(title), payments(gig_amount, status, paid_to_student_at)").eq("student_id", user.id).then(({ data }) => {
      setRows(data || []);
    });
  }, [user]);

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payments yet.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.gigs?.title}</TableCell>
                <TableCell>{r.payments?.gig_amount ? formatPKR(r.payments.gig_amount) : "—"}</TableCell>
                <TableCell><StatusBadge status={r.payments?.status || r.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.payments?.paid_to_student_at ? new Date(r.payments.paid_to_student_at).toLocaleDateString() : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
export default StudentPayments;
