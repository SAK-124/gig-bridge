import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { StorageObjectButton } from "@/components/StorageObjectButton";
import { fetchProfileMap } from "@/lib/profileMaps";
import { HireChat } from "@/components/HireChat";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { paymentDisplayStatus } from "@/lib/payments";
import { toast } from "sonner";
import { Loader2, Check, RotateCcw, ShieldAlert, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

const ActiveGigs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hires, setHires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [disputeForm, setDisputeForm] = useState<Record<string, { open: boolean; reason: string; saving: boolean }>>({});

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("hires").select("id, status, student_id, gigs(title), payments(status, business_proof_url), submissions(id, message, link_url, file_url, created_at)").eq("business_id", user.id).order("created_at", { ascending: false });
    const profileMap = await fetchProfileMap((data || []).map((h: any) => h.student_id), "full_name");
    setHires((data || []).map((h: any) => ({ ...h, profiles: profileMap.get(h.student_id) || null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const approve = async (id: string) => {
    setActing(id);
    await supabase.from("hires").update({ status: "approved" }).eq("id", id);
    await supabase.from("payments").update({ status: "payout_pending" }).eq("hire_id", id);
    setActing(null);
    toast.success("Approved! Admin will release the payout.");
    load();
  };

  const requestRevision = async (id: string) => {
    setActing(id);
    await supabase.from("hires").update({ status: "revision_requested" }).eq("id", id);
    setActing(null);
    toast.success("Revision requested.");
    load();
  };

  const openDisputeForm = (id: string) => {
    setDisputeForm((prev) => ({ ...prev, [id]: { open: true, reason: "", saving: false } }));
  };

  const raiseDispute = async (hireId: string) => {
    const df = disputeForm[hireId];
    if (!df || !df.reason.trim()) return toast.error("Please describe the reason for the dispute");
    if (!user) return;
    setDisputeForm((prev) => ({ ...prev, [hireId]: { ...prev[hireId], saving: true } }));
    await supabase.from("disputes").insert({
      hire_id: hireId,
      raised_by_id: user.id,
      raised_by_role: "business",
      reason: df.reason.trim(),
    });
    await supabase.from("hires").update({ status: "disputed" }).eq("id", hireId);
    await supabase.from("payments").update({ status: "disputed" }).eq("hire_id", hireId);
    setDisputeForm((prev) => ({ ...prev, [hireId]: { open: false, reason: "", saving: false } }));
    toast.success("Dispute raised. Admin will review this hire.");
    load();
  };

  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Active gigs</h1>
        <p className="text-muted-foreground">Review submissions and release payments.</p>
      </div>
      {hires.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl text-muted-foreground">No active hires yet.</Card>
      ) : (
        <div className="space-y-3">
          {hires.map((h) => {
            const sub = h.submissions?.[h.submissions.length - 1];
            const isExpanded = expanded[h.id];
            const df = disputeForm[h.id];
            const paymentStatus = paymentDisplayStatus(h.payments?.status, !!h.payments?.business_proof_url);
            const fileIsExternal = typeof sub?.file_url === "string" && /^https?:\/\//i.test(sub.file_url);
            return (
              <Card key={h.id} className="p-5 rounded-2xl border-border/60">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                  <div>
                    <div className="font-semibold">{h.gigs?.title}</div>
                    <div className="text-xs text-muted-foreground">Hired: {h.profiles?.full_name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.status} />
                    <Button size="sm" variant="ghost" onClick={() => toggleExpand(h.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {sub && (
                  <div className="bg-muted/40 rounded-xl p-3 text-sm space-y-1 mb-3">
                    <div className="font-medium text-xs uppercase text-muted-foreground">Latest submission</div>
                    <p className="whitespace-pre-wrap">{sub.message}</p>
                    {sub.link_url && <a href={sub.link_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">{sub.link_url}</a>}
                    {sub.file_url && (
                      fileIsExternal ? (
                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="block text-primary hover:underline text-xs">Open submitted file</a>
                      ) : (
                        <div className="pt-1">
                          <StorageObjectButton bucket="submission-files" path={sub.file_url} label="Open submitted file" size="sm" />
                        </div>
                      )
                    )}
                  </div>
                )}
                {h.status === "awaiting_payment" && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Button size="sm" onClick={() => navigate(`/business/payments/${h.id}/transfer`)}>
                      {paymentStatus === "awaiting_proof" ? "Send transfer" : "View payment status"}
                    </Button>
                    <StatusBadge status={paymentStatus} />
                  </div>
                )}
                {h.status === "submitted" && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Button size="sm" onClick={() => approve(h.id)} disabled={acting === h.id}>
                      <Check className="mr-2 h-4 w-4" />Approve work
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => requestRevision(h.id)} disabled={acting === h.id}>
                      <RotateCcw className="mr-2 h-4 w-4" />Request revision
                    </Button>
                    <Dialog open={df?.open} onOpenChange={(o) => { if (o) openDisputeForm(h.id); else setDisputeForm((prev) => ({ ...prev, [h.id]: { ...prev[h.id], open: false } })); }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive"><ShieldAlert className="mr-2 h-4 w-4" />Raise dispute</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Raise a dispute</DialogTitle></DialogHeader>
                        <div className="space-y-4 text-sm">
                          <p className="text-muted-foreground">Describe the issue clearly. Gig Bridge will review the original gig brief, submitted work, chat history, and any evidence you provide.</p>
                          <div>
                            <Label>Reason *</Label>
                            <Textarea
                              rows={4}
                              value={df?.reason || ""}
                              onChange={(e) => setDisputeForm((prev) => ({ ...prev, [h.id]: { ...prev[h.id], reason: e.target.value } }))}
                              placeholder="What is the issue with the submitted work? How does it not meet the agreed deliverables?"
                            />
                          </div>
                          <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground">
                            You can also upload evidence on the dispute page after submitting.
                          </div>
                          <Button onClick={() => raiseDispute(h.id)} disabled={df?.saving} className="w-full">
                            {df?.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit dispute
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                {h.status === "disputed" && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/business/dispute/${h.id}`)}>
                    <ShieldAlert className="mr-2 h-4 w-4" />View dispute
                  </Button>
                )}
                {/* Expandable chat */}
                {isExpanded && (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <HireChat hireId={h.id} />
                  </div>
                )}
                {!isExpanded && (
                  <button type="button" onClick={() => toggleExpand(h.id)} className="mt-2 text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" />Show messages
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveGigs;
