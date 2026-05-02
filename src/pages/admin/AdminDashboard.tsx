import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentProofUploader } from "@/components/PaymentProofUploader";
import { PaymentProofViewer } from "@/components/PaymentProofViewer";
import { formatPKR, paymentDisplayStatus } from "@/lib/payments";
import { toast } from "sonner";
import { Loader2, Wallet, Users, Briefcase, ShieldAlert, Sparkles, RefreshCw, ShieldCheck, BadgeCheck, Eye } from "lucide-react";
import { StatCard } from "@/components/StatCard";

type PayoutForm = { method: string; reference: string; proofPath: string };

const AdminDashboard = () => {
  const { role, loading: roleLoading, user } = useUserRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, gigs: 0, commission: 0, payouts: 0, awaitingVerification: 0 });
  const [pendingVerification, setPendingVerification] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [gigs, setGigs] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [bankView, setBankView] = useState<{ open: boolean; data?: any }>({ open: false });
  const [payoutForms, setPayoutForms] = useState<Record<string, PayoutForm>>({});
  const [activePayoutId, setActivePayoutId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (roleLoading) return;
    if (!user) { navigate("/admin/login"); return; }
    if (role !== "admin") { navigate("/admin/login"); return; }
    load();
  }, [role, roleLoading, user]);

  const load = async () => {
    const [usersRes, gigsRes, paymentsRes, disputeRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, full_name, university, company_name, created_at").order("created_at", { ascending: false }),
      supabase.from("gigs").select("id, title, budget, status, location, created_at").order("created_at", { ascending: false }),
      supabase.from("payments").select("*, hires(id, student_id, business_id, gigs(title), profiles:student_id(full_name))").order("created_at", { ascending: false }),
      supabase.from("hires").select("id, status, created_at, gigs(title), profiles:student_id(full_name), payments(id, status, total_amount, business_proof_url)").eq("status", "disputed").order("created_at", { ascending: false }),
    ]);
    const all = paymentsRes.data || [];
    setUsers(usersRes.data || []);
    setGigs(gigsRes.data || []);
    setDisputes(disputeRes.data || []);
    setAllPayments(all);
    setPendingVerification(all.filter((p: any) => p.status === "awaiting" && p.business_proof_url));
    setPendingPayouts(all.filter((p: any) => p.status === "payout_pending"));
    setStats({
      users: usersRes.data?.length || 0,
      gigs: gigsRes.data?.length || 0,
      commission: all.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + parseFloat(p.platform_fee), 0),
      payouts: all.filter((p: any) => p.status === "payout_pending").length,
      awaitingVerification: all.filter((p: any) => p.status === "awaiting" && p.business_proof_url).length,
    });
  };

  const viewBank = async (studentId: string) => {
    const { data } = await supabase.from("bank_details").select("*").eq("user_id", studentId).maybeSingle();
    setBankView({ open: true, data });
  };

  const confirmReceived = async (paymentId: string) => {
    setSavingId(paymentId);
    const { error } = await supabase.from("payments").update({
      status: "received",
      admin_verified_at: new Date().toISOString(),
      admin_verified_by: user?.id,
    }).eq("id", paymentId);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success("Payment confirmed. Student can start work.");
    load();
  };

  const rejectProof = async (paymentId: string) => {
    setSavingId(paymentId);
    await supabase.from("payments").update({
      business_proof_url: null,
      business_proof_uploaded_at: null,
    }).eq("id", paymentId);
    setSavingId(null);
    toast.success("Proof cleared. Business will need to re-upload.");
    load();
  };

  const updatePayoutForm = (id: string, patch: Partial<PayoutForm>) => {
    setPayoutForms((prev) => ({ ...prev, [id]: { method: "Bank transfer", reference: "", proofPath: "", ...prev[id], ...patch } }));
  };

  const markPaid = async (paymentId: string, hireId: string) => {
    const f = payoutForms[paymentId] || { method: "Bank transfer", reference: "", proofPath: "" };
    if (!f.method) return toast.error("Select payout method");
    if (!f.proofPath) return toast.error("Upload payout proof first");
    setSavingId(paymentId);
    await supabase.from("payments").update({
      status: "paid",
      payout_method: f.method,
      payout_reference: f.reference,
      admin_payout_proof_url: f.proofPath,
      admin_payout_proof_uploaded_at: new Date().toISOString(),
      paid_to_student_at: new Date().toISOString(),
    }).eq("id", paymentId);
    await supabase.from("hires").update({ status: "paid" }).eq("id", hireId);
    setSavingId(null);
    setActivePayoutId(null);
    setPayoutForms((prev) => { const next = { ...prev }; delete next[paymentId]; return next; });
    toast.success("Payout recorded — student notified.");
    load();
  };

  const resolveDispute = async (hireId: string, paymentId: string | undefined, decision: "release" | "refund") => {
    setSavingId(hireId);
    if (decision === "release") {
      await supabase.from("hires").update({ status: "approved" }).eq("id", hireId);
      if (paymentId) await supabase.from("payments").update({ status: "payout_pending" }).eq("id", paymentId);
      toast.success("Marked for payout to student.");
    } else {
      await supabase.from("hires").update({ status: "approved" }).eq("id", hireId);
      if (paymentId) await supabase.from("payments").update({ status: "refunded" }).eq("id", paymentId);
      toast.success("Marked as refunded to business.");
    }
    setSavingId(null);
    load();
  };

  const resetDemo = async () => {
    if (!confirm("Reset demo data? This wipes existing demo users (gigbridge.test) and re-creates them.")) return;
    setResetting(true);
    const { data, error } = await supabase.functions.invoke("reset-demo", { body: {} });
    setResetting(false);
    if (error) return toast.error(error.message);
    if (data?.error) return toast.error(data.error);
    toast.success(`Demo data reset · ${data?.created_users || 0} users · ${data?.created_gigs || 0} gigs · password ${data?.demo_password || "DemoPass123!"}`);
    load();
  };

  if (roleLoading || !user || role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8 max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-secondary flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-accent" />Admin dashboard
            </h1>
            <p className="text-muted-foreground">Verify transfers, release payouts, manage demo content.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetDemo} disabled={resetting}>
              {resetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Reset demo data
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>Home</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total users" value={stats.users} icon={Users} />
          <StatCard label="Total gigs" value={stats.gigs} icon={Briefcase} />
          <StatCard label="To verify" value={stats.awaitingVerification} icon={ShieldCheck} />
          <StatCard label="Pending payouts" value={stats.payouts} icon={Wallet} />
          <StatCard label="Commission" value={formatPKR(stats.commission)} icon={Wallet} />
        </div>

        <Tabs defaultValue="verify">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="verify">Verify transfers ({pendingVerification.length})</TabsTrigger>
            <TabsTrigger value="payouts">Pending payouts ({pendingPayouts.length})</TabsTrigger>
            <TabsTrigger value="all">All payments</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="gigs">Gigs</TabsTrigger>
            <TabsTrigger value="disputes">Disputes ({disputes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="verify" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingVerification.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">All transfers verified.</TableCell></TableRow>
                  ) : pendingVerification.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.hires?.gigs?.title}</TableCell>
                      <TableCell>{p.hires?.profiles?.full_name}</TableCell>
                      <TableCell className="font-semibold">{formatPKR(p.total_amount)}</TableCell>
                      <TableCell className="font-mono text-xs">{p.business_proof_reference || "—"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {p.business_proof_url && <PaymentProofViewer path={p.business_proof_url} label="Proof" />}
                          <Button size="sm" variant="outline" onClick={() => rejectProof(p.id)} disabled={savingId === p.id}>Reject</Button>
                          <Button size="sm" onClick={() => confirmReceived(p.id)} disabled={savingId === p.id}>
                            {savingId === p.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5 mr-1" />}
                            Confirm received
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending payouts.</TableCell></TableRow>
                  ) : pendingPayouts.map((p: any) => {
                    const f = payoutForms[p.id] || { method: "Bank transfer", reference: "", proofPath: "" };
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.hires?.gigs?.title}</TableCell>
                        <TableCell>{p.hires?.profiles?.full_name}</TableCell>
                        <TableCell className="font-semibold">{formatPKR(p.gig_amount)}</TableCell>
                        <TableCell><Button size="sm" variant="outline" onClick={() => viewBank(p.hires.student_id)}><Eye className="h-3.5 w-3.5 mr-1" />View bank</Button></TableCell>
                        <TableCell>
                          <Dialog open={activePayoutId === p.id} onOpenChange={(o) => setActivePayoutId(o ? p.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm">Mark paid</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Record payout to {p.hires?.profiles?.full_name}</DialogTitle></DialogHeader>
                              <div className="space-y-3">
                                <div>
                                  <Label>Method</Label>
                                  <Select value={f.method} onValueChange={(v) => updatePayoutForm(p.id, { method: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Bank transfer">Bank transfer</SelectItem>
                                      <SelectItem value="Easypaisa">Easypaisa</SelectItem>
                                      <SelectItem value="JazzCash">JazzCash</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Reference / TID</Label>
                                  <Input value={f.reference} onChange={(e) => updatePayoutForm(p.id, { reference: e.target.value })} placeholder="Transaction ID from your banking app" />
                                </div>
                                <div>
                                  <Label className="mb-1.5 block">Payout screenshot</Label>
                                  {f.proofPath ? (
                                    <div className="flex items-center gap-2 text-sm text-success"><BadgeCheck className="h-4 w-4" />Proof uploaded</div>
                                  ) : (
                                    <PaymentProofUploader hireId={p.hires?.id} uploaderRole="admin" onUploaded={(path) => updatePayoutForm(p.id, { proofPath: path })} buttonLabel="Upload payout screenshot" />
                                  )}
                                </div>
                                <Button onClick={() => markPaid(p.id, p.hire_id)} disabled={savingId === p.id} className="w-full">
                                  {savingId === p.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm payout
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                    <TableHead>Total</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Proofs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments yet.</TableCell></TableRow>
                  ) : allPayments.map((p: any) => {
                    const display = paymentDisplayStatus(p.status, !!p.business_proof_url);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.hires?.gigs?.title}</TableCell>
                        <TableCell>{p.hires?.profiles?.full_name}</TableCell>
                        <TableCell>{formatPKR(p.total_amount)}</TableCell>
                        <TableCell>{formatPKR(p.gig_amount)}</TableCell>
                        <TableCell className="text-success font-medium">{formatPKR(p.platform_fee)}</TableCell>
                        <TableCell><StatusBadge status={display} /></TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {p.business_proof_url && <PaymentProofViewer path={p.business_proof_url} label="Transfer" variant="ghost" />}
                            {p.admin_payout_proof_url && <PaymentProofViewer path={p.admin_payout_proof_url} label="Payout" variant="ghost" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
                  ) : users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "Unnamed user"}</TableCell>
                      <TableCell>{u.university || "—"}</TableCell>
                      <TableCell>{u.company_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="gigs" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gigs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No gigs found.</TableCell></TableRow>
                  ) : gigs.map((g: any) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.title}</TableCell>
                      <TableCell>{formatPKR(g.budget)}</TableCell>
                      <TableCell>{g.location}</TableCell>
                      <TableCell><StatusBadge status={g.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="disputes" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead className="text-right">Resolution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No disputes.</TableCell></TableRow>
                  ) : disputes.map((d: any) => {
                    const paymentId = Array.isArray(d.payments) ? d.payments[0]?.id : d.payments?.id;
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.gigs?.title}</TableCell>
                        <TableCell>{d.profiles?.full_name || "Student"}</TableCell>
                        <TableCell>{Array.isArray(d.payments) ? formatPKR(d.payments[0]?.total_amount || 0) : formatPKR(d.payments?.total_amount || 0)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => resolveDispute(d.id, paymentId, "refund")} disabled={savingId === d.id}>Refund business</Button>
                            <Button size="sm" onClick={() => resolveDispute(d.id, paymentId, "release")} disabled={savingId === d.id}>Release to student</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
