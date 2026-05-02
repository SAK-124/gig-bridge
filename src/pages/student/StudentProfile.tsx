import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Lock, Upload, X, Plus } from "lucide-react";
import { PAKISTAN_UNIVERSITIES } from "@/lib/universities";
import { SKILL_SUGGESTIONS } from "@/lib/skill-suggestions";

const StudentProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [universityChoice, setUniversityChoice] = useState<string>("Other");
  const [universityCustom, setUniversityCustom] = useState<string>("");
  const [p, setP] = useState<any>({
    full_name: "", university: "", degree: "", graduation_year: "", bio: "",
    availability: "", preferred_work_type: "either", portfolio_links: "", resume_url: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [bank, setBank] = useState<any>({ account_title: "", bank_name: "", iban: "", easypaisa: "", jazzcash: "", cnic: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [pr, b] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("bank_details").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (pr.data) {
        const uni = pr.data.university || "";
        const isKnown = (PAKISTAN_UNIVERSITIES as readonly string[]).includes(uni);
        setUniversityChoice(uni ? (isKnown ? uni : "Other") : "Other");
        setUniversityCustom(isKnown ? "" : uni);
        setP({
          full_name: pr.data.full_name || "",
          university: uni,
          degree: pr.data.degree || "",
          graduation_year: pr.data.graduation_year || "",
          bio: pr.data.bio || "",
          availability: pr.data.availability || "",
          preferred_work_type: pr.data.preferred_work_type || "either",
          portfolio_links: (pr.data.portfolio_links || []).join(", "),
          resume_url: pr.data.resume_url || "",
        });
        setSkills(pr.data.skills || []);
      }
      if (b.data) setBank({
        account_title: b.data.account_title || "", bank_name: b.data.bank_name || "", iban: b.data.iban || "",
        easypaisa: b.data.easypaisa || "", jazzcash: b.data.jazzcash || "", cnic: b.data.cnic || "",
      });
      setLoading(false);
    })();
  }, [user]);

  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (!s) return;
    if (skills.find((x) => x.toLowerCase() === s.toLowerCase())) return;
    setSkills([...skills, s]);
    setSkillInput("");
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const finalUniversity = universityChoice === "Other" ? universityCustom.trim() : universityChoice;
    const profilePayload = {
      user_id: user.id,
      full_name: p.full_name.trim(),
      university: finalUniversity || null,
      degree: p.degree.trim() || null,
      graduation_year: p.graduation_year ? parseInt(String(p.graduation_year)) : null,
      skills,
      bio: p.bio.trim() || null,
      availability: p.availability.trim() || null,
      preferred_work_type: p.preferred_work_type,
      portfolio_links: p.portfolio_links ? p.portfolio_links.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      resume_url: p.resume_url || null,
    };
    const { error } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "user_id" });
    const { error: bErr } = await supabase.from("bank_details").upsert({ user_id: user.id, ...bank }, { onConflict: "user_id" });
    setSaving(false);
    if (error || bErr) return toast.error((error || bErr)?.message);
    toast.success("Profile saved!");
  };

  const uploadResume = async (file?: File) => {
    if (!user || !file) return;
    setUploadingResume(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/resume-${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
    setUploadingResume(false);
    if (error) return toast.error(error.message);
    setP({ ...p, resume_url: path });
    toast.success("Resume uploaded. Save your profile to keep it linked.");
  };

  const suggestedNotYetPicked = SKILL_SUGGESTIONS.filter((s) => !skills.find((x) => x.toLowerCase() === s.toLowerCase())).slice(0, 12);

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
          <div>
            <Label>University</Label>
            <Select value={universityChoice} onValueChange={setUniversityChoice}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {PAKISTAN_UNIVERSITIES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            {universityChoice === "Other" && (
              <Input className="mt-2" placeholder="Type your university" value={universityCustom} onChange={(e) => setUniversityCustom(e.target.value)} />
            )}
          </div>
          <div><Label>Degree / program</Label><Input value={p.degree} onChange={(e) => setP({ ...p, degree: e.target.value })} placeholder="BSc Computer Science" /></div>
          <div><Label>Graduation year</Label><Input type="number" min="2024" max="2032" value={p.graduation_year} onChange={(e) => setP({ ...p, graduation_year: e.target.value })} /></div>

          <div className="sm:col-span-2 space-y-2">
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-1.5 min-h-[2.25rem] rounded-md border border-input bg-background px-2 py-1.5">
              {skills.length === 0 && <span className="text-xs text-muted-foreground self-center px-1">No skills yet — add some below.</span>}
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="px-2 py-1 gap-1">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} aria-label={`Remove ${s}`} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput); } }}
                placeholder="Type a skill and press Enter"
              />
              <Button type="button" variant="outline" onClick={() => addSkill(skillInput)}><Plus className="h-4 w-4" /></Button>
            </div>
            {suggestedNotYetPicked.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestedNotYetPicked.map((s) => (
                  <button type="button" key={s} onClick={() => addSkill(s)} className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-smooth">
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2"><Label>Bio</Label><Textarea rows={3} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} maxLength={500} placeholder="A short, friendly intro businesses will read first." /></div>
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
          <div className="sm:col-span-2 space-y-2">
            <Label>Resume upload</Label>
            <div className="flex flex-wrap gap-2">
              <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => uploadResume(e.target.files?.[0])} disabled={uploadingResume} />
              {uploadingResume && <Button type="button" variant="outline" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading</Button>}
            </div>
            {p.resume_url && <p className="text-xs text-muted-foreground flex items-center gap-1"><Upload className="h-3.5 w-3.5" />Resume linked privately for admins.</p>}
          </div>
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
