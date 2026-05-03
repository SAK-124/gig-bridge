import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { EmptyApplications } from "@/assets/illustrations";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";
import { computeFees, formatPKR } from "@/lib/payments";
import { fetchProfileMap } from "@/lib/profileMaps";

const Applicants = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Record<string, any[]>>({});
  const [gigs, setGigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: gigList } = await supabase.from("gigs").select("id, title, budget").eq("business_id", user.id);
    const ids = (gigList || []).map((g) => g.id);
    const gigMap: Record<string, any> = {};
    (gigList || []).forEach((g) => gigMap[g.id] = g);
    setGigs(gigMap);
    if (!ids.length) { setLoading(false); return; }
    const { data: apps } = await supabase.from("applications").select("id, status, cover_letter, student_id, gig_id, created_at").in("gig_id", ids);
    const profileMap = await fetchProfileMap((apps || []).map((a: any) => a.student_id), "full_name, university, skills");
    const grouped: Record<string, any[]> = {};
    (apps || []).forEach((a: any) => { (grouped[a.gig_id] ||= []).push({ ...a, profiles: profileMap.get(a.student_id) || null }); });
    setGroups(grouped);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const hire = async (app: any) => {
    if (!user) return;
    setHiring(app.id);
    const gig = gigs[app.gig_id];
    const fees = computeFees(parseFloat(gig.budget));

    const { data: hire, error: hErr } = await supabase.from("hires").insert({
      gig_id: app.gig_id,
      student_id: app.student_id,
      business_id: user.id,
      application_id: app.id,
      status: "awaiting_payment",
    }).select().single();
    if (hErr || !hire) { setHiring(null); return toast.error(hErr?.message || "Failed to create hire"); }

    const { error: cErr } = await supabase.functions.invoke("initiate-payment", {
      body: { hire_id: hire.id, gig_amount: fees.gigAmount, platform_fee: fees.platformFee, total: fees.total },
    });
    if (cErr) { setHiring(null); return toast.error(cErr.message); }

    await supabase.from("applications").update({ status: "hired" }).eq("id", app.id);
    setHiring(null);
    toast.success("Student hired — send your transfer next.");
    navigate(`/business/payments/${hire.id}/transfer`);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  const gigIds = Object.keys(groups);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Applicants</h1>
        <p className="text-muted-foreground">Review and hire students. Hiring opens the bank-transfer escrow flow.</p>
      </div>
      {gigIds.length === 0 ? (
        <EmptyState
          illustration={<EmptyApplications className="w-full" />}
          title="No applicants yet"
          description="Once you post a gig, applications will appear here grouped by gig."
          ctaLabel="Post a gig"
          ctaTo="/business/post"
        />
      ) : gigIds.map((gid) => (
        <div key={gid} className="space-y-3">
          <h2 className="font-semibold text-lg">{gigs[gid]?.title} <span className="text-muted-foreground text-sm">· {formatPKR(gigs[gid]?.budget)}</span></h2>
          {groups[gid].map((a) => (
            <Card key={a.id} className="p-5 rounded-2xl border-border/60 hover:shadow-card transition-smooth">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div>
                  <div className="font-semibold">{a.profiles?.full_name || "Student"}</div>
                  <div className="text-xs text-muted-foreground">{a.profiles?.university}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              {a.profiles?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {a.profiles.skills.slice(0, 6).map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
              )}
              <p className="text-sm text-foreground/80 mb-4 whitespace-pre-wrap">{a.cover_letter}</p>
              {a.status !== "hired" && (
                <Button size="sm" onClick={() => hire(a)} disabled={hiring === a.id}>
                  {hiring === a.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                  Hire — pay {formatPKR(computeFees(parseFloat(gigs[gid]?.budget)).total)}
                </Button>
              )}
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Applicants;
