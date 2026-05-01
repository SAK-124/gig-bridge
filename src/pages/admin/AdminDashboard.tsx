import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPKR } from "@/lib/payments";
import { toast } from "sonner";
import { Loader2, Wallet, Users, Briefcase, ShieldAlert } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, gigs: 0, commission: 0, payouts: 0 });
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [bankView, setBankView] = useState<{ open: boolean; data?: any }>({ open: false });
  const [payoutForm, setPayoutForm] = useState({ method: "", reference: "" });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (roleLoading) return;
    if (role !== "admin") { navigate("/"); return; }
    load();
  }, [role, roleLoading]);

  const load = async () => {
    const [usersRes, gigsRes, paymentsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("gigs").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("*, hires(student_id, business_id, gigs(title), profiles:student_id(full_name))"),
    ]);
    const all = paymentsRes.data || [];
    setAllPayments(all);
    setPendingPayouts(all.filter((p: any) => p.status === "payout_pending"));
    setStats({
      users: usersRes.count || 0,
      gigs: gigsRes.count || 0,
      commission: all.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + parseFloat(p.platform_fee), 0),
      payouts: all.filter((p: any) => p.status === "payout_pending").length,
    });
  };

  const viewBank = async (studentId: string) => {
    const { data } = await supabase.from("bank_details").select("*").eq("user_id", studentId).maybeSingle();
    setBankView({ open: true, data });
  };

  const markPaid = async (paymentId: string, hireId: string) => {
    if (!payoutForm.method) return toast.error("Enter payout method");
    setSaving(true);
    await supabase.from("payments").update({ status: "paid", payout_method: payoutForm.method, payout_reference: payoutForm.reference, paid_to_student_at: new Date().toISOString() }).eq("id", paymentId);
    await supabase.from("hires").update({ status: "paid" }).eq("id", hireId);
    setSaving(false);
    setActiveId(null);
    setPayoutForm({ method: "", reference: "" });
    toast.success("Payout marked as paid!");
    load();
  };

  const markReceived = async (id: string, hireId: string) => {
    await supabase.from("payments").update({ status: "received" }).eq("id", id);
    await supabase.from("hires").update({ status: "payment_received" }).eq("id", hireId);
    toast.success("Payment marked as received");
    load();
  };

  if (roleLoading || role !== "admin") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-secondary flex items-center gap-2"><ShieldAlert className="h-7 w-7 text-accent" />Admin dashboard</h1>
            <p className="text-muted-foreground">Manage payouts, users, and platform health.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>Home</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total users" value={stats.users} icon={Users} />
          <StatCard label="Total gigs" value={stats.gigs} icon={Briefcase} />
          <StatCard label="Pending payouts" value={stats.payouts} icon={Wallet} />
          <StatCard label="Commission earned" value={formatPKR(stats.commission)} icon={Wallet} />
        </div>

        <Tabs defaultValue="payouts">
          <TabsList>
            <TabsTrigger value="payouts">Pending payouts ({pendingPayouts.length})</TabsTrigger>
            <TabsTrigger value="all">All payments</TabsTrigger>
          </TabsList>

          <TabsContent value="payouts" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending payouts.</TableCell></TableRow>
                  ) : pendingPayouts.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.hires?.gigs?.title}</TableCell>
                      <TableCell>{p.hires?.profiles?.full_name}</TableCell>
                      <TableCell className="font-semibold">{formatPKR(p.gig_amount)}</TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => viewBank(p.hires.student_id)}>View bank</Button></TableCell>
                      <TableCell>
                        <Dialog open={activeId === p.id} onOpenChange={(o) => setActiveId(o ? p.id : null)}>
                          <DialogTrigger asChild><Button size="sm">Mark paid</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Record payout</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                              <div><Label>Method</Label><Input value={payoutForm.method} onChange={(e) => setPayoutForm({ ...payoutForm, method: e.target.value })} placeholder="Bank transfer / Easypaisa / JazzCash" /></div>
                              <div><Label>Reference</Label><Input value={payoutForm.reference} onChange={(e) => setPayoutForm({ ...payoutForm, reference: e.target.value })} placeholder="Transaction ID" /></div>
                              <Button onClick={() => markPaid(p.id, p.hire_id)} disabled={saving} className="w-full">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm payout
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.hires?.gigs?.title}</TableCell>
                      <TableCell>{p.hires?.profiles?.full_name}</TableCell>
                      <TableCell>{formatPKR(p.total_amount)}</TableCell>
                      <TableCell>{formatPKR(p.gig_amount)}</TableCell>
                      <TableCell className="text-success font-medium">{formatPKR(p.platform_fee)}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>
                        {p.status === "awaiting" && (
                          <Button size="sm" variant="outline" onClick={() => markReceived(p.id, p.hire_id)}>Mark received</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={bankView.open} onOpenChange={(o) => setBankView({ open: o, data: bankView.data })}>
          <DialogContent>
            <DialogHeader><DialogTitle>Student payout details</DialogTitle></DialogHeader>
            {bankView.data ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Account title:</span> <span className="font-medium">{bankView.data.account_title || "—"}</span></div>
                <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{bankView.data.bank_name || "—"}</span></div>
                <div><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{bankView.data.iban || "—"}</span></div>
                <div><span className="text-muted-foreground">Easypaisa:</span> <span className="font-mono">{bankView.data.easypaisa || "—"}</span></div>
                <div><span className="text-muted-foreground">JazzCash:</span> <span className="font-mono">{bankView.data.jazzcash || "—"}</span></div>
                <div><span className="text-muted-foreground">CNIC:</span> <span className="font-mono">{bankView.data.cnic || "—"}</span></div>
              </div>
            ) : <p className="text-muted-foreground">Student hasn't added bank details yet.</p>}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
