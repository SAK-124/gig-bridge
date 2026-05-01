import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

const StudentProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<any>({ full_name: "", university: "", degree: "", graduation_year: "", skills: "", bio: "", availability: "", preferred_work_type: "either", portfolio_links: "" });
  const [bank, setBank] = useState<any>({ account_title: "", bank_name: "", iban: "", easypaisa: "", jazzcash: "", cnic: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [pr, b] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("bank_details").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (pr.data) setP({
        full_name: pr.data.full_name || "",
        university: pr.data.university || "",
        degree: pr.data.degree || "",
        graduation_year: pr.data.graduation_year || "",
        skills: (pr.data.skills || []).join(", "),
        bio: pr.data.bio || "",
        availability: pr.data.availability || "",
        preferred_work_type: pr.data.preferred_work_type || "either",
        portfolio_links: (pr.data.portfolio_links || []).join(", "),
      });
      if (b.data) setBank({
        account_title: b.data.account_title || "", bank_name: b.data.bank_name || "", iban: b.data.iban || "",
        easypaisa: b.data.easypaisa || "", jazzcash: b.data.jazzcash || "", cnic: b.data.cnic || "",
      });
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const profilePayload = {
      user_id: user.id,
      full_name: p.full_name.trim(),
      university: p.university.trim() || null,
      degree: p.degree.trim() || null,
      graduation_year: p.graduation_year ? parseInt(p.graduation_year) : null,
      skills: p.skills ? p.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      bio: p.bio.trim() || null,
      availability: p.availability.trim() || null,
      preferred_work_type: p.preferred_work_type,
      portfolio_links: p.portfolio_links ? p.portfolio_links.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    };
    const { error } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "user_id" });
    const { error: bErr } = await supabase.from("bank_details").upsert({ user_id: user.id, ...bank }, { onConflict: "user_id" });
    setSaving(false);
    if (error || bErr) return toast.error((error || bErr)?.message);
    toast.success("Profile saved!");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">My profile</h1>
        <p className="text-muted-foreground">Help businesses get to know you.</p>
      </div>

      <Card className="p-6 rounded-2xl border-border/60 space-y-4">
        <h2 className="font-semibold text-lg">About you</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} /></div>
          <div><Label>University</Label><Input value={p.university} onChange={(e) => setP({ ...p, university: e.target.value })} /></div>
          <div><Label>Degree / program</Label><Input value={p.degree} onChange={(e) => setP({ ...p, degree: e.target.value })} /></div>
          <div><Label>Graduation year</Label><Input type="number" value={p.graduation_year} onChange={(e) => setP({ ...p, graduation_year: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Skills (comma-separated)</Label><Input value={p.skills} onChange={(e) => setP({ ...p, skills: e.target.value })} placeholder="React, copywriting, Urdu translation" /></div>
          <div className="sm:col-span-2"><Label>Bio</Label><Textarea rows={3} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} maxLength={500} /></div>
          <div><Label>Availability</Label><Input value={p.availability} onChange={(e) => setP({ ...p, availability: e.target.value })} placeholder="10 hrs/week" /></div>
          <div>
            <Label>Preferred work type</Label>
            <Select value={p.preferred_work_type} onValueChange={(v) => setP({ ...p, preferred_work_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="either">Either</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2"><Label>Portfolio links (comma-separated)</Label><Input value={p.portfolio_links} onChange={(e) => setP({ ...p, portfolio_links: e.target.value })} placeholder="https://github.com/you, https://behance.net/you" /></div>
        </div>
      </Card>

      <Card className="p-6 rounded-2xl border-primary/30 bg-primary-soft/40 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-lg">Payout details</h2>
        </div>
        <p className="text-xs text-muted-foreground">🔒 Visible only to you and Gig Bridge admins. Businesses can never see this.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Account title</Label><Input value={bank.account_title} onChange={(e) => setBank({ ...bank, account_title: e.target.value })} /></div>
          <div><Label>Bank name</Label><Input value={bank.bank_name} onChange={(e) => setBank({ ...bank, bank_name: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>IBAN / account number</Label><Input value={bank.iban} onChange={(e) => setBank({ ...bank, iban: e.target.value })} /></div>
          <div><Label>Easypaisa (optional)</Label><Input value={bank.easypaisa} onChange={(e) => setBank({ ...bank, easypaisa: e.target.value })} /></div>
          <div><Label>JazzCash (optional)</Label><Input value={bank.jazzcash} onChange={(e) => setBank({ ...bank, jazzcash: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>CNIC (optional, hidden)</Label><Input value={bank.cnic} onChange={(e) => setBank({ ...bank, cnic: e.target.value })} /></div>
        </div>
      </Card>

      <Button onClick={save} disabled={saving} size="lg">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save profile
      </Button>
    </div>
  );
};

export default StudentProfile;
