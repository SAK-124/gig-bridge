import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const ActiveWork = () => {
  const { user } = useAuth();
  const [hires, setHires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ message: "", link_url: "", file_url: "" });
  const [activeHire, setActiveHire] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("hires").select("id, status, gigs(title, budget), payments(status)").eq("student_id", user.id).order("created_at", { ascending: false });
    setHires(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

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
    setForm({ message: "", link_url: "", file_url: "" });
    setActiveHire(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Active work</h1>
        <p className="text-muted-foreground">Submit your deliverables here.</p>
      </div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : hires.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl text-muted-foreground">No active work yet.</Card>
      ) : (
        <div className="space-y-3">
          {hires.map((h) => (
            <Card key={h.id} className="p-5 rounded-2xl border-border/60">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div>
                  <div className="font-semibold">{h.gigs?.title}</div>
                </div>
                <StatusBadge status={h.status} />
              </div>
              {["payment_received", "in_progress", "revision_requested"].includes(h.status) && (
                <Dialog open={activeHire === h.id} onOpenChange={(o) => setActiveHire(o ? h.id : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Upload className="h-4 w-4 mr-2" />Submit work</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Submit your work</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Message</Label><Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe what you've delivered..." /></div>
                      <div><Label>Link (optional)</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." /></div>
                      <div><Label>File link (optional)</Label><Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="Google Drive, Dropbox, or other file URL" /></div>
                      <Button onClick={submitWork} disabled={submitting} className="w-full">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default ActiveWork;
