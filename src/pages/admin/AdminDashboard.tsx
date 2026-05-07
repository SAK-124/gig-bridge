import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentProofUploader } from "@/components/PaymentProofUploader";
import { PaymentProofViewer } from "@/components/PaymentProofViewer";
import { formatPKR, paymentDisplayStatus } from "@/lib/payments";
import { toast } from "sonner";
import { Loader2, Wallet, Users, Briefcase, ShieldAlert, Sparkles, ShieldCheck, BadgeCheck, Eye, Plus, Pencil, Building2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StorageObjectButton } from "@/components/StorageObjectButton";
import { DeleteActionButton } from "@/components/DeleteActionButton";
import { fetchProfileMap } from "@/lib/profileMaps";

type PayoutForm = { method: string; reference: string; proofPath: string };

type BankAccountForm = {
  label: string; bank_name: string; account_title: string;
  iban: string; account_number: string; easypaisa_number: string;
  jazzcash_number: string; instructions: string;
};

const emptyBankForm: BankAccountForm = {
  label: "", bank_name: "", account_title: "",
  iban: "", account_number: "", easypaisa_number: "",
  jazzcash_number: "", instructions: "",
};

const deletedRow = (data: unknown[] | null | undefined) => Array.isArray(data) && data.length > 0;

const AdminDashboard = () => {
  const { role, loading: roleLoading, user } = useUserRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, gigs: 0, gigsCompleted: 0, commission: 0, payouts: 0, awaitingVerification: 0 });
  const [pendingVerification, setPendingVerification] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [gigs, setGigs] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankView, setBankView] = useState<{ open: boolean; data?: any }>({ open: false });
  const [payoutForms, setPayoutForms] = useState<Record<string, PayoutForm>>({});
  const [activePayoutId, setActivePayoutId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [bankForm, setBankForm] = useState<BankAccountForm>(emptyBankForm);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [savingBank, setSavingBank] = useState(false);
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (roleLoading) return;
    if (!user) { navigate("/admin/login"); return; }
    if (role !== "admin") { navigate("/admin/login"); return; }
    load();
  }, [role, roleLoading, user]);

  const load = async () => {
    const [usersRes, gigsRes, paymentsRes, disputeRes, bankRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, full_name, university, company_name, created_at").order("created_at", { ascending: false }),
      supabase.from("gigs").select("id, title, budget, status, location, created_at, business_id").order("created_at", { ascending: false }),
      supabase.from("payments").select("*, hires(id, student_id, business_id, status, gigs(title, business_id))").order("created_at", { ascending: false }),
      supabase.from("hires").select("id, status, created_at, student_id, business_id, gigs(title), payments(id, status, total_amount, business_proof_url), disputes(id, reason, raised_by_role, status, evidence_urls), submissions(id, message, link_url, file_url, created_at)").eq("status", "disputed").order("created_at", { ascending: false }),
      supabase.from("platform_bank_accounts").select("*").order("sort_order"),
    ]);
    const queryErrors = [usersRes.error, gigsRes.error, paymentsRes.error, disputeRes.error, bankRes.error].filter(Boolean);
    if (queryErrors.length) toast.error(queryErrors[0]?.message || "Could not load admin dashboard data");

    const gigRows = gigsRes.data || [];
    const paymentRows = paymentsRes.data || [];
    const disputeRows = disputeRes.data || [];
    const businessIds = [
      ...gigRows.map((g: any) => g.business_id),
      ...paymentRows.map((p: any) => p.hires?.business_id || p.hires?.gigs?.business_id),
      ...disputeRows.map((d: any) => d.business_id),
    ];
    const studentIds = [
      ...paymentRows.map((p: any) => p.hires?.student_id),
      ...disputeRows.map((d: any) => d.student_id),
    ];
    const [businessProfiles, studentProfiles] = await Promise.all([
      fetchProfileMap(businessIds, "company_name, full_name"),
      fetchProfileMap(studentIds, "full_name"),
    ]);
    const gigsWithProfiles = gigRows.map((g: any) => ({ ...g, profiles: businessProfiles.get(g.business_id) || null }));
    const all = paymentRows.map((p: any) => {
      const hire = p.hires;
      if (!hire) return p;
      const businessId = hire.business_id || hire.gigs?.business_id;
      return {
        ...p,
        hires: {
          ...hire,
          profiles: studentProfiles.get(hire.student_id) || null,
          gigs: hire.gigs ? { ...hire.gigs, profiles: businessProfiles.get(businessId) || null } : hire.gigs,
        },
      };
    });
    const disputesWithProfiles = disputeRows.map((d: any) => ({ ...d, profiles: studentProfiles.get(d.student_id) || null }));

    setUsers(usersRes.data || []);
    setGigs(gigsWithProfiles);
    setDisputes(disputesWithProfiles);
    setAllPayments(all);
    setBankAccounts(bankRes.data || []);
    setPendingVerification(all.filter((p: any) => p.business_proof_url && !p.admin_verified_at && !["paid", "refunded"].includes(p.status)));
    setPendingPayouts(all.filter((p: any) => p.status === "payout_pending"));
    setStats({
      users: usersRes.data?.length || 0,
      gigs: gigsRes.data?.length || 0,
      gigsCompleted: all.filter((p: any) => p.status === "paid").length,
      commission: all.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + parseFloat(p.platform_fee), 0),
      payouts: all.filter((p: any) => p.status === "payout_pending").length,
      awaitingVerification: all.filter((p: any) => p.business_proof_url && !p.admin_verified_at && !["paid", "refunded"].includes(p.status)).length,
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

  const resolveDispute = async (hireId: string, paymentId: string | undefined, decision: "release" | "refund" | "revision", notes?: string) => {
    setSavingId(hireId);
    if (decision === "release") {
      await supabase.from("hires").update({ status: "approved" }).eq("id", hireId);
      if (paymentId) await supabase.from("payments").update({ status: "payout_pending" }).eq("id", paymentId);
      await supabase.from("disputes").update({ status: "resolved", resolution: "release", admin_notes: notes || null, resolved_at: new Date().toISOString() }).eq("hire_id", hireId);
      toast.success("Marked for payout to student.");
    } else if (decision === "refund") {
      await supabase.from("hires").update({ status: "approved" }).eq("id", hireId);
      if (paymentId) await supabase.from("payments").update({ status: "refunded" }).eq("id", paymentId);
      await supabase.from("disputes").update({ status: "resolved", resolution: "refund", admin_notes: notes || null, resolved_at: new Date().toISOString() }).eq("hire_id", hireId);
      toast.success("Marked as refunded to business.");
    } else {
      await supabase.from("hires").update({ status: "revision_requested" }).eq("id", hireId);
      if (paymentId) await supabase.from("payments").update({ status: "received" }).eq("id", paymentId);
      await supabase.from("disputes").update({ status: "resolved", resolution: "revision", admin_notes: notes || null, resolved_at: new Date().toISOString() }).eq("hire_id", hireId);
      toast.success("Revision requested. Student to resubmit.");
    }
    setSavingId(null);
    load();
  };

  const saveBankAccount = async () => {
    if (!bankForm.label.trim()) return toast.error("Label is required");
    setSavingBank(true);
    if (editingBankId) {
      const { error } = await supabase.from("platform_bank_accounts").update({ ...bankForm }).eq("id", editingBankId);
      if (error) { setSavingBank(false); return toast.error(error.message); }
      toast.success("Account updated.");
    } else {
      const { error } = await supabase.from("platform_bank_accounts").insert({ ...bankForm });
      if (error) { setSavingBank(false); return toast.error(error.message); }
      toast.success("Account added.");
    }
    setSavingBank(false);
    setBankFormOpen(false);
    setBankForm(emptyBankForm);
    setEditingBankId(null);
    load();
  };

  const deleteBankAccount = async (id: string) => {
    setDeletingId(id);
    const { data, error } = await supabase.from("platform_bank_accounts").update({ is_active: false }).eq("id", id).select("id");
    setDeletingId(null);
    if (error) return toast.error(error.message);
    if (!deletedRow(data)) return toast.error("Nothing changed. Refresh and try again.");
    toast.success("Account deactivated.");
    load();
  };

  const openEditBank = (acc: any) => {
    setBankForm({
      label: acc.label || "", bank_name: acc.bank_name || "", account_title: acc.account_title || "",
      iban: acc.iban || "", account_number: acc.account_number || "", easypaisa_number: acc.easypaisa_number || "",
      jazzcash_number: acc.jazzcash_number || "", instructions: acc.instructions || "",
    });
    setEditingBankId(acc.id);
    setBankFormOpen(true);
  };

  const deleteGig = async (id: string) => {
    setDeletingId(id);
    const { data, error } = await supabase.from("gigs").delete().eq("id", id).select("id");
    setDeletingId(null);
    if (error) return toast.error(error.message);
    if (!deletedRow(data)) return toast.error("Gig was not deleted. Refresh and try again.");
    toast.success("Gig deleted.");
    load();
  };

  const deleteProfile = async (profile: any) => {
    setDeletingId(`profile-${profile.id}`);
    const { data, error } = await supabase.from("profiles").delete().eq("id", profile.id).select("id");
    setDeletingId(null);
    if (error) return toast.error(error.message);
    if (!deletedRow(data)) return toast.error("Profile was not deleted. Refresh and try again.");
    toast.success("Profile deleted. Login account remains active.");
    load();
  };

  const deleteUser = async (profile: any) => {
    setDeletingId(profile.id);
    const { data, error } = await supabase.rpc("admin_delete_user" as any, { target_user_id: profile.user_id } as any);
    setDeletingId(null);
    if (error) return toast.error(error.message);
    if (!data) return toast.error("User was not deleted. Refresh and try again.");
    toast.success("User removed.");
    load();
  };

  const deletePayment = async (id: string) => {
    setDeletingId(id);
    const { data, error } = await supabase.from("payments").delete().eq("id", id).select("id");
    setDeletingId(null);
    if (error) return toast.error(error.message);
    if (!deletedRow(data)) return toast.error("Payment was not deleted. Refresh and try again.");
    toast.success("Payment record deleted.");
    load();
  };

  const deleteDispute = async (id: string) => {
    setDeletingId(id);
    const { data, error } = await supabase.from("disputes").delete().eq("id", id).select("id");
    setDeletingId(null);
    if (error) return toast.error(error.message);
    if (!deletedRow(data)) return toast.error("Dispute was not deleted. Refresh and try again.");
    toast.success("Dispute deleted.");
    load();
  };

  const deleteSubmission = async (id: string) => {
    setDeletingId(id);
    const { data, error } = await supabase.from("submissions").delete().eq("id", id).select("id");
    setDeletingId(null);
    if (error) return toast.error(error.message);
    if (!deletedRow(data)) return toast.error("Submission was not deleted. Refresh and try again.");
    toast.success("Submission deleted.");
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
            <p className="text-muted-foreground">Verify transfers, release payouts, manage platform bank details.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetDemo} disabled={resetting}>
              {resetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Reset demo data
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>Home</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Users" value={stats.users} icon={Users} />
          <StatCard label="Total Gigs" value={stats.gigs} icon={Briefcase} />
          <StatCard label="Gigs Completed" value={stats.gigsCompleted} icon={BadgeCheck} />
          <StatCard label="Pending Verification" value={stats.awaitingVerification} icon={ShieldCheck} />
          <StatCard label="Pending Payouts" value={stats.payouts} icon={Wallet} />
          <StatCard label="Total Commission" value={formatPKR(stats.commission)} icon={Wallet} />
        </div>

        <Tabs defaultValue="verify">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="verify">Verify transfers ({pendingVerification.length})</TabsTrigger>
            <TabsTrigger value="payouts">Pending payouts ({pendingPayouts.length})</TabsTrigger>
            <TabsTrigger value="all">All payments</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="gigs">Gigs</TabsTrigger>
            <TabsTrigger value="disputes">Disputes ({disputes.length})</TabsTrigger>
            <TabsTrigger value="bank">Bank details</TabsTrigger>
          </TabsList>

          {/* Verify transfers tab */}
          <TabsContent value="verify" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingVerification.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">All transfers verified.</TableCell></TableRow>
                  ) : pendingVerification.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.hires?.gigs?.title}</TableCell>
                      <TableCell className="text-sm">{p.hires?.gigs?.profiles?.company_name || p.hires?.gigs?.profiles?.full_name || "—"}</TableCell>
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

          {/* Pending payouts tab */}
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

          {/* All payments tab — enhanced with business name, student, work status */}
          <TabsContent value="all" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Work status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                        <TableCell className="text-sm text-muted-foreground">{p.hires?.gigs?.profiles?.company_name || p.hires?.gigs?.profiles?.full_name || "—"}</TableCell>
                        <TableCell>{p.hires?.profiles?.full_name}</TableCell>
                        <TableCell className="font-semibold">{formatPKR(p.total_amount)}</TableCell>
                        <TableCell><StatusBadge status={p.hires?.status || "—"} /></TableCell>
                        <TableCell><StatusBadge status={display} /></TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1 items-center">
                            {p.business_proof_url && <PaymentProofViewer path={p.business_proof_url} label="Transfer" variant="ghost" />}
                            {p.admin_payout_proof_url && <PaymentProofViewer path={p.admin_payout_proof_url} label="Payout" variant="ghost" />}
                            {p.status === "payout_pending" && (
                              <Button size="sm" variant="outline" onClick={() => { setActivePayoutId(p.id); }}>
                                Release
                              </Button>
                            )}
                            <DeleteActionButton
                              title="Delete payment record?"
                              description="This deletes this payment row only. Related hire records remain unless they are removed separately."
                              confirmLabel="Delete payment"
                              onConfirm={() => deletePayment(p.id)}
                              disabled={deletingId === p.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="users" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
                  ) : users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "Unnamed user"}</TableCell>
                      <TableCell>{u.university || "—"}</TableCell>
                      <TableCell>{u.company_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <DeleteActionButton
                            title="Delete profile only?"
                            description="This removes the public/profile row, but keeps the user's login account so they can keep signing in and rebuild the profile."
                            confirmLabel="Delete profile"
                            variant="outline"
                            onConfirm={() => deleteProfile(u)}
                            disabled={deletingId === `profile-${u.id}`}
                          >
                            Profile
                          </DeleteActionButton>
                          <DeleteActionButton
                            title="Delete login account?"
                            description="This removes the auth account. Profile, roles, and records with cascading user links are removed, and the email can sign up again."
                            confirmLabel="Delete account"
                            onConfirm={() => deleteUser(u)}
                            disabled={deletingId === u.id}
                          >
                            Account
                          </DeleteActionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Gigs tab — now shows business name */}
          <TabsContent value="gigs" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gigs.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No gigs found.</TableCell></TableRow>
                  ) : gigs.map((g: any) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.title}</TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          {g.profiles?.company_name || g.profiles?.full_name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>{formatPKR(g.budget)}</TableCell>
                      <TableCell>{g.location}</TableCell>
                      <TableCell><StatusBadge status={g.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DeleteActionButton
                          title="Delete gig?"
                          description="This deletes the gig and cascades its applications, hires, payments, submissions, messages, disputes, and reviews."
                          confirmLabel="Delete gig"
                          onConfirm={() => deleteGig(g.id)}
                          disabled={deletingId === g.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Disputes tab — enhanced with reason, raised by, evidence, admin notes, revision option */}
          <TabsContent value="disputes" className="mt-4">
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Raised by</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead className="text-right">Resolution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No disputes.</TableCell></TableRow>
                  ) : disputes.map((d: any) => {
                    const paymentId = Array.isArray(d.payments) ? d.payments[0]?.id : d.payments?.id;
                    const disputeRow = Array.isArray(d.disputes) ? d.disputes[0] : d.disputes;
                    const notes = disputeNotes[d.id] || "";
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.gigs?.title}</TableCell>
                        <TableCell>{d.profiles?.full_name || "Student"}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${disputeRow?.raised_by_role === "business" ? "bg-accent/20 text-accent-foreground" : "bg-primary/15 text-primary"}`}>
                            {disputeRow?.raised_by_role || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[180px] text-sm text-muted-foreground truncate" title={disputeRow?.reason || ""}>
                          {disputeRow?.reason || "No reason provided"}
                        </TableCell>
                        <TableCell>{Array.isArray(d.payments) ? formatPKR(d.payments[0]?.total_amount || 0) : formatPKR(d.payments?.total_amount || 0)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">Resolve</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader><DialogTitle>Resolve dispute — {d.gigs?.title}</DialogTitle></DialogHeader>
                              <div className="space-y-4 text-sm">
                                <div>
                                  <div className="font-medium mb-1">Dispute reason</div>
                                  <div className="bg-muted/40 rounded-lg p-3 text-foreground/80">{disputeRow?.reason || "No reason provided"}</div>
                                </div>
                                {Array.isArray(d.submissions) && d.submissions.length > 0 && (
                                  <div>
                                    <div className="font-medium mb-1">Student submission</div>
                                    {d.submissions.map((s: any) => {
                                      const fileIsExternal = typeof s.file_url === "string" && /^https?:\/\//i.test(s.file_url);
                                      return (
                                        <div key={s.id} className="bg-muted/40 rounded-lg p-3 text-foreground/80 space-y-1.5 mb-2">
                                          <p className="whitespace-pre-wrap text-xs">{s.message}</p>
                                          {s.link_url && <a href={s.link_url} target="_blank" rel="noreferrer" className="block text-primary hover:underline text-xs">{s.link_url}</a>}
                                          {s.file_url && (fileIsExternal
                                            ? <a href={s.file_url} target="_blank" rel="noreferrer" className="block text-primary hover:underline text-xs">Open submitted file</a>
                                            : <StorageObjectButton bucket="submission-files" path={s.file_url} label="Open submitted file" size="sm" />
                                          )}
                                          <DeleteActionButton
                                            title="Delete this submission?"
                                            description="This removes only this submitted work record. The hire and payment rows remain."
                                            confirmLabel="Delete submission"
                                            variant="outline"
                                            onConfirm={() => deleteSubmission(s.id)}
                                            disabled={deletingId === s.id}
                                          >
                                            Delete submission
                                          </DeleteActionButton>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {disputeRow?.evidence_urls?.length > 0 && (
                                  <div>
                                    <div className="font-medium mb-1">Evidence ({disputeRow.evidence_urls.length} files)</div>
                                    <div className="flex flex-wrap gap-2">
                                      {disputeRow.evidence_urls.map((url: string, i: number) => (
                                        <a key={i} href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">File {i + 1}</a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <Label>Admin notes (optional)</Label>
                                  <Textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setDisputeNotes((prev) => ({ ...prev, [d.id]: e.target.value }))}
                                    placeholder="Internal notes about your decision..."
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button onClick={() => resolveDispute(d.id, paymentId, "release", notes)} disabled={savingId === d.id} className="w-full">
                                    {savingId === d.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Release payment to student
                                  </Button>
                                  <Button variant="outline" onClick={() => resolveDispute(d.id, paymentId, "revision", notes)} disabled={savingId === d.id} className="w-full">
                                    Request revision
                                  </Button>
                                  <Button variant="destructive" onClick={() => resolveDispute(d.id, paymentId, "refund", notes)} disabled={savingId === d.id} className="w-full">
                                    Refund to business
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {disputeRow?.id && (
                            <DeleteActionButton
                              title="Delete dispute?"
                              description="This deletes the dispute record only. The hire, payment, and submissions remain."
                              confirmLabel="Delete dispute"
                              onConfirm={() => deleteDispute(disputeRow.id)}
                              disabled={deletingId === disputeRow.id}
                            />
                          )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Bank details tab */}
          <TabsContent value="bank" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Platform bank accounts</h2>
                <p className="text-sm text-muted-foreground">These details are shown to businesses when they need to transfer payment.</p>
              </div>
              <Dialog open={bankFormOpen} onOpenChange={(o) => { setBankFormOpen(o); if (!o) { setBankForm(emptyBankForm); setEditingBankId(null); } }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add account</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>{editingBankId ? "Edit" : "Add"} bank account</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Label *</Label><Input value={bankForm.label} onChange={(e) => setBankForm({ ...bankForm, label: e.target.value })} placeholder="e.g. Gig Bridge Escrow — primary" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Bank name</Label><Input value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} /></div>
                      <div><Label>Account title</Label><Input value={bankForm.account_title} onChange={(e) => setBankForm({ ...bankForm, account_title: e.target.value })} /></div>
                    </div>
                    <div><Label>IBAN</Label><Input value={bankForm.iban} onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })} placeholder="PKXXMEZN..." /></div>
                    <div><Label>Account number</Label><Input value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Easypaisa</Label><Input value={bankForm.easypaisa_number} onChange={(e) => setBankForm({ ...bankForm, easypaisa_number: e.target.value })} /></div>
                      <div><Label>JazzCash</Label><Input value={bankForm.jazzcash_number} onChange={(e) => setBankForm({ ...bankForm, jazzcash_number: e.target.value })} /></div>
                    </div>
                    <div><Label>Instructions for business</Label><Textarea rows={2} value={bankForm.instructions} onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })} placeholder="Use the hire ID as the transfer reference..." /></div>
                    <Button onClick={saveBankAccount} disabled={savingBank} className="w-full">
                      {savingBank && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingBankId ? "Update" : "Add"} account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {bankAccounts.filter((a: any) => a.is_active).length === 0 ? (
              <Card className="p-8 text-center rounded-2xl text-muted-foreground">No active bank accounts. Add one above.</Card>
            ) : (
              <div className="space-y-3">
                {bankAccounts.filter((a: any) => a.is_active).map((acc: any) => (
                  <Card key={acc.id} className="p-5 rounded-2xl border-border/60">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="space-y-1 text-sm">
                        <div className="font-semibold text-base">{acc.label}</div>
                        {acc.bank_name && <div className="text-muted-foreground">{acc.bank_name} · {acc.account_title}</div>}
                        {acc.iban && <div className="font-mono text-xs">IBAN: {acc.iban}</div>}
                        {acc.account_number && <div className="font-mono text-xs">Account: {acc.account_number}</div>}
                        {(acc.easypaisa_number || acc.jazzcash_number) && (
                          <div className="text-xs text-muted-foreground">
                            {acc.easypaisa_number && `Easypaisa: ${acc.easypaisa_number}`}
                            {acc.easypaisa_number && acc.jazzcash_number && " · "}
                            {acc.jazzcash_number && `JazzCash: ${acc.jazzcash_number}`}
                          </div>
                        )}
                        {acc.instructions && <div className="text-xs italic text-muted-foreground mt-1">{acc.instructions}</div>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditBank(acc)}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                        <DeleteActionButton
                          title="Deactivate bank account?"
                          description="This hides the platform bank account from business transfer screens. Existing payment records are not changed."
                          confirmLabel="Deactivate"
                          onConfirm={() => deleteBankAccount(acc.id)}
                          disabled={deletingId === acc.id}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Student bank details dialog */}
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
