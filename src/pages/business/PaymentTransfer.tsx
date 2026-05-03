import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentProofUploader } from "@/components/PaymentProofUploader";
import { PaymentProofViewer } from "@/components/PaymentProofViewer";
import { fetchActivePlatformBankAccount, formatPKR, paymentDisplayStatus, transferReferenceForHire, type PlatformBankAccount } from "@/lib/payments";
import { fetchProfileMap } from "@/lib/profileMaps";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Building, Copy, Loader2, ShieldCheck, Wallet } from "lucide-react";

const PaymentTransfer = () => {
  const { hireId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hire, setHire] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [bank, setBank] = useState<PlatformBankAccount | null>(null);
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!user || !hireId) return;
    (async () => {
      const [{ data: h }, { data: p }, b] = await Promise.all([
        supabase.from("hires").select("id, status, business_id, student_id, gigs(title, budget)").eq("id", hireId).maybeSingle(),
        supabase.from("payments").select("*").eq("hire_id", hireId).maybeSingle(),
        fetchActivePlatformBankAccount(),
      ]);
      if (!h || h.business_id !== user.id) {
        toast.error("This hire isn't yours.");
        navigate("/business/payments");
        return;
      }
      const profileMap = await fetchProfileMap(h?.student_id ? [h.student_id] : [], "full_name");
      setHire({ ...h, profiles: profileMap.get(h.student_id) || null });
      setPayment(p);
      setBank(b);
      setReference(p?.business_proof_reference || transferReferenceForHire(hireId));
      setLoading(false);
    })();
  }, [user, hireId, navigate]);

  const copy = (v?: string | null) => {
    if (!v) return;
    navigator.clipboard.writeText(v).then(() => toast.success("Copied"));
  };

  const handleProofUploaded = async (path: string) => {
    setSaving(true);
    const { error } = await supabase.from("payments").update({
      business_proof_url: path,
      business_proof_uploaded_at: new Date().toISOString(),
      business_proof_reference: reference || transferReferenceForHire(hireId!),
    }).eq("id", payment.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted for verification.");
    const { data: refreshed } = await supabase.from("payments").select("*").eq("id", payment.id).maybeSingle();
    if (refreshed) setPayment(refreshed);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;
  if (!hire || !payment) return <Card className="p-12 rounded-2xl text-center">Payment not found.</Card>;

  const display = paymentDisplayStatus(payment.status, !!payment.business_proof_url);
  const sharedLabel = "after-transfer-only";

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild><Link to="/business/payments"><ArrowLeft className="h-4 w-4 mr-1" />Back to payments</Link></Button>

      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-secondary">Send your payment</h1>
          <p className="text-muted-foreground">Hire: {hire.gigs?.title} · Student: {hire.profiles?.full_name}</p>
        </div>
        <StatusBadge status={display} />
      </div>

      <Card className="p-6 rounded-2xl border-primary/30 bg-primary-soft/40 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-semibold">Held in escrow until you approve the work</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><div className="text-muted-foreground text-xs uppercase">Gig amount</div><div className="font-semibold text-base">{formatPKR(payment.gig_amount)}</div></div>
          <div><div className="text-muted-foreground text-xs uppercase">Platform fee (10%)</div><div className="font-semibold text-base">{formatPKR(payment.platform_fee)}</div></div>
          <div><div className="text-muted-foreground text-xs uppercase">You transfer</div><div className="font-display font-bold text-2xl text-primary">{formatPKR(payment.total_amount)}</div></div>
        </div>
      </Card>

      <Card className="p-6 rounded-2xl border-border/60 space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-secondary" />
          <h2 className="font-semibold text-lg">Step 1 — Transfer to Gig Bridge</h2>
        </div>
        {bank ? (
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field label="Bank" value={bank.bank_name} onCopy={() => copy(bank.bank_name)} />
            <Field label="Account title" value={bank.account_title} onCopy={() => copy(bank.account_title)} />
            <Field label="IBAN" value={bank.iban} mono onCopy={() => copy(bank.iban)} />
            <Field label="Account #" value={bank.account_number} mono onCopy={() => copy(bank.account_number)} />
            {bank.easypaisa_number && <Field label="Easypaisa" value={bank.easypaisa_number} mono onCopy={() => copy(bank.easypaisa_number)} />}
            {bank.jazzcash_number && <Field label="JazzCash" value={bank.jazzcash_number} mono onCopy={() => copy(bank.jazzcash_number)} />}
          </div>
        ) : (
          <p className="text-sm text-destructive">No platform bank account configured. Ask the admin to add one.</p>
        )}
        {bank?.instructions && <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">{bank.instructions}</p>}
        <div className="flex flex-wrap gap-3 items-center bg-accent/10 rounded-xl p-3">
          <Badge className="bg-accent/30 text-accent-foreground border-accent/40">Reference</Badge>
          <code className="font-mono text-sm text-secondary">{reference}</code>
          <Button size="sm" variant="ghost" onClick={() => copy(reference)}><Copy className="h-3.5 w-3.5 mr-1" />Copy</Button>
          <span className="text-xs text-muted-foreground">Add this to your transfer remarks so we match instantly.</span>
        </div>
      </Card>

      <Card className="p-6 rounded-2xl border-border/60 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-secondary" />
          <h2 className="font-semibold text-lg">Step 2 — Upload your transfer proof</h2>
        </div>
        {payment.business_proof_url ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-success font-medium text-sm">
              <BadgeCheck className="h-4 w-4" /> Screenshot received — admin is verifying.
            </div>
            <div className="flex flex-wrap gap-2">
              <PaymentProofViewer path={payment.business_proof_url} label="View my proof" />
              <PaymentProofUploader hireId={hireId!} uploaderRole="business" onUploaded={handleProofUploaded} buttonLabel="Replace screenshot" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <Label>Reference / transaction ID (optional)</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={transferReferenceForHire(hireId!)} className="font-mono" data-shared={sharedLabel} />
              </div>
              <PaymentProofUploader hireId={hireId!} uploaderRole="business" onUploaded={handleProofUploaded} />
            </div>
            <p className="text-xs text-muted-foreground">After you upload, admin verifies the transfer (usually within a business day) and the student starts work.</p>
          </div>
        )}
        {saving && <p className="text-xs text-muted-foreground"><Loader2 className="inline h-3 w-3 animate-spin mr-1" />Saving…</p>}
      </Card>
    </div>
  );
};

const Field = ({ label, value, mono, onCopy }: { label: string; value: string | null; mono?: boolean; onCopy: () => void }) => (
  <div className="rounded-xl border border-border/70 bg-card p-3 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium truncate ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
    {value && (
      <button type="button" onClick={onCopy} aria-label={`Copy ${label}`} className="text-muted-foreground hover:text-primary transition-smooth shrink-0">
        <Copy className="h-4 w-4" />
      </button>
    )}
  </div>
);

export default PaymentTransfer;
