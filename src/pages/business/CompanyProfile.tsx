import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CompanyProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState({ full_name: "", company_name: "", company_website: "", company_description: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setP({
        full_name: data.full_name || "",
        company_name: data.company_name || "",
        company_website: data.company_website || "",
        company_description: data.company_description || "",
      });
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, ...p }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved!");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Company profile</h1>
        <p className="text-muted-foreground">Help students learn about your business.</p>
      </div>
      <Card className="p-6 rounded-2xl border-border/60 space-y-4">
        <div><Label>Your name</Label><Input value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} /></div>
        <div><Label>Company name</Label><Input value={p.company_name} onChange={(e) => setP({ ...p, company_name: e.target.value })} /></div>
        <div><Label>Website</Label><Input value={p.company_website} onChange={(e) => setP({ ...p, company_website: e.target.value })} /></div>
        <div><Label>About the company</Label><Textarea rows={4} value={p.company_description} onChange={(e) => setP({ ...p, company_description: e.target.value })} maxLength={500} /></div>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
      </Card>
    </div>
  );
};

export default CompanyProfile;
