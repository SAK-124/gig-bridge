import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { HireChat } from "@/components/HireChat";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StorageObjectButton } from "@/components/StorageObjectButton";
import { Loader2, Upload, ShieldAlert, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { DeleteActionButton } from "@/components/DeleteActionButton";

const ActiveWork = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hires, setHires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ message: "", link_url: "", file_url: "" });
  const [activeHire, setActiveHire] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [disputeForm, setDisputeForm] = useState<Record<string, { open: boolean; reason: string; saving: boolean }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetSubmissionForm = () => {
    setForm({ message: "", link_url: "", file_url: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("hires").select("id, status, gigs(title, budget), payments(status), submissions(id, message, link_url, file_url, created_at)").eq("student_id", user.id).order("created_at", { ascending: false });
    setHires(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const uploadSubmissionFile = async (file?: File | null) => {
    if (!activeHire || !file) return;
    setUploadingFile(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${activeHire}/student-${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("submission-files").upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
    setUploadingFile(false);
    if (error) return toast.error(error.message);
    setForm((prev) => ({ ...prev, file_url: path }));
    toast.success("Submission file uploaded.");
  };

  const submitWork = async () => {
    if (!activeHire) return;
    if (form.message.trim().length < 10) return toast.error("Add a short message");
    setSubmitting(true);
    const { error: subErr } = await supabase.from("submissions").insert({
      hire_id: activeHire, message: form.message.trim(), link_url: form.link_url || null, file_url: form.file_url || null,
    });
    if (!subErr) {
      await supabase.from("hires").update({ status: "submitted" }).eq("id", activeHire);
    }
    setSubmitting(false);
    if (subErr) return toast.error(subErr.message);
    toast.success("Work submitted! Waiting for business approval.");
    resetSubmissionForm();
    setActiveHire(null);
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
      raised_by_role: "student",
      reason: df.reason.trim(),
    });
    await supabase.from("hires").update({ status: "disputed" }).eq("id", hireId);
    await supabase.from("payments").update({ status: "disputed" }).eq("hire_id", hireId);
    setDisputeForm((prev) => ({ ...prev, [hireId]: { open: false, reason: "", saving: false } }));
    toast.success("Dispute raised. Admin will review.");
    load();
  };

  const deleteSubmission = async (hireId: string, submissionId: string) => {
    const { data, error } = await supabase.from("submissions").delete().eq("id", submissionId).select("id");
    if (error) return toast.error(error.message);
    if (!data?.length) return toast.error("Submission was not deleted. Refresh and try again.");
    await supabase.from("hires").update({ status: "revision_requested" }).eq("id", hireId);
    toast.success("Submission deleted. You can upload a revised version.");
    load();
  };

  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Active work</h1>
        <p className="text-muted-foreground">Submit your deliverables and message your client here.</p>
      </div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : hires.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl text-muted-foreground">No active work yet.</Card>
      ) : (
        <div className="space-y-3">
          {hires.map((h) => {
            const isExpanded = expanded[h.id];
            const df = disputeForm[h.id];
            const latestSubmission = h.submissions?.[h.submissions.length - 1];
            return (
              <Card key={h.id} className="p-5 rounded-2xl border-border/60">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                  <div>
                    <div className="font-semibold">{h.gigs?.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.status} />
                    <Button size="sm" variant="ghost" onClick={() => toggleExpand(h.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {latestSubmission && ["submitted", "revision_requested"].includes(h.status) && (
                    <DeleteActionButton
                      title="Delete latest submission?"
                      description="This removes your latest submitted work record and moves the hire back into revision so you can resubmit."
                      confirmLabel="Delete submission"
                      variant="outline"
                      onConfirm={() => deleteSubmission(h.id, latestSubmission.id)}
                    >
                      Delete submission
                    </DeleteActionButton>
                  )}

                  {["payment_received", "in_progress", "revision_requested"].includes(h.status) && (
                    <Dialog open={activeHire === h.id} onOpenChange={(o) => { setActiveHire(o ? h.id : null); if (!o) resetSubmissionForm(); }}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Upload className="h-4 w-4 mr-2" />Submit work</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Submit your work</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Message</Label><Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe what you've delivered..." className="text-base" /></div>
                          <div><Label>Link (optional)</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." className="text-base" /></div>
                          <div className="space-y-2">
                            <Label>File upload (optional)</Label>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.webp"
                              className="hidden"
                              onChange={(e) => uploadSubmissionFile(e.target.files?.[0])}
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                                {uploadingFile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Upload file
                              </Button>
                              {form.file_url && <StorageObjectButton bucket="submission-files" path={form.file_url} label="Open uploaded file" />}
                            </div>
                            <p className="text-xs text-muted-foreground">Upload the final file directly here, or leave this blank and submit a link instead.</p>
                          </div>
                          <Button onClick={submitWork} disabled={submitting} className="w-full">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Dispute option for students on submitted or revision_requested */}
                  {["submitted", "revision_requested", "in_progress"].includes(h.status) && (
                    <Dialog open={df?.open} onOpenChange={(o) => { if (o) openDisputeForm(h.id); else setDisputeForm((prev) => ({ ...prev, [h.id]: { ...prev[h.id], open: false } })); }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <ShieldAlert className="h-4 w-4 mr-2" />Raise dispute
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Raise a dispute</DialogTitle></DialogHeader>
                        <div className="space-y-4 text-sm">
                          <p className="text-muted-foreground">Payment protected by Gig Bridge. Describe the issue — admin will review the gig brief, your submission, chat history, and any evidence.</p>
                          <div>
                            <Label>Reason *</Label>
                            <Textarea
                              rows={4}
                              value={df?.reason || ""}
                              onChange={(e) => setDisputeForm((prev) => ({ ...prev, [h.id]: { ...prev[h.id], reason: e.target.value } }))}
                              placeholder="What is the problem? e.g. Business won't respond, revision keeps changing scope..."
                              className="text-base"
                            />
                          </div>
                          <Button onClick={() => raiseDispute(h.id)} disabled={df?.saving} className="w-full">
                            {df?.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit dispute
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {h.status === "disputed" && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/student/dispute/${h.id}`)}>
                      <ShieldAlert className="mr-2 h-4 w-4" />View dispute
                    </Button>
                  )}
                </div>

                {/* Expandable chat */}
                {isExpanded ? (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <HireChat hireId={h.id} />
                  </div>
                ) : (
                  <button type="button" onClick={() => toggleExpand(h.id)} className="mt-3 text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" />Messages
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
export default ActiveWork;
