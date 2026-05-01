import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Loader2, Check, RotateCcw } from "lucide-react";

const ActiveGigs = () => {
  const { user } = useAuth();
  const [hires, setHires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("hires").select("id, status, gigs(title), profiles:student_id(full_name), submissions(id, message, link_url, created_at)").eq("business_id", user.id).order("created_at", { ascending: false });
    setHires(data || []);
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
            return (
              <Card key={h.id} className="p-5 rounded-2xl border-border/60">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                  <div>
                    <div className="font-semibold">{h.gigs?.title}</div>
                    <div className="text-xs text-muted-foreground">Hired: {h.profiles?.full_name}</div>
                  </div>
                  <StatusBadge status={h.status} />
                </div>
                {sub && (
                  <div className="bg-muted/40 rounded-xl p-3 text-sm space-y-1 mb-3">
                    <div className="font-medium text-xs uppercase text-muted-foreground">Latest submission</div>
                    <p className="whitespace-pre-wrap">{sub.message}</p>
                    {sub.link_url && <a href={sub.link_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">{sub.link_url}</a>}
                  </div>
                )}
                {h.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve(h.id)} disabled={acting === h.id}>
                      <Check className="mr-2 h-4 w-4" />Approve work
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => requestRevision(h.id)} disabled={acting === h.id}>
                      <RotateCcw className="mr-2 h-4 w-4" />Request revision
                    </Button>
                  </div>
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
