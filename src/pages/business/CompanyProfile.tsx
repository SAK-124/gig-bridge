import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, BadgeCheck } from "lucide-react";
import { DeleteActionButton } from "@/components/DeleteActionButton";

const CompanyProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [p, setP] = useState({
    full_name: "",
    company_name: "",
    company_website: "",
    company_description: "",
    linkedin_url: "",
    instagram_url: "",
    contact_number: "",
    contact_email: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setP({
          full_name: data.full_name || "",
          company_name: data.company_name || "",
          company_website: data.company_website || "",
          company_description: data.company_description || "",
          linkedin_url: data.linkedin_url || "",
          instagram_url: data.instagram_url || "",
          contact_number: data.contact_number || "",
          contact_email: data.contact_email || "",
        });
        setIsVerified(data.is_business_verified || false);
      }
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

  const deleteProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").delete().eq("user_id", user.id).select("id");
    if (error) return toast.error(error.message);
    if (!data?.length) return toast.error("Profile was not deleted. Refresh and try again.");
    toast.success("Company profile deleted. Your login account remains active.");
    window.location.reload();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-secondary">Company profile</h1>
          <p className="text-muted-foreground">Help students learn about your business.</p>
        </div>
        {isVerified && (
          <Badge variant="outline" className="mt-1 bg-success/15 text-success border-success/40 flex items-center gap-1">
            <BadgeCheck className="h-3.5 w-3.5" />Verified Business
          </Badge>
        )}
      </div>

      <Card className="p-6 rounded-2xl border-border/60 space-y-4">
        <h2 className="font-semibold text-lg">Basic info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Your name</Label>
            <Input className="text-base" value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Company name</Label>
            <Input className="text-base" value={p.company_name} onChange={(e) => setP({ ...p, company_name: e.target.value })} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Website</Label>
            <Input className="text-base" value={p.company_website} onChange={(e) => setP({ ...p, company_website: e.target.value })} placeholder="https://yourcompany.com" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>About the company</Label>
            <Textarea rows={4} className="text-base" value={p.company_description} onChange={(e) => setP({ ...p, company_description: e.target.value })} maxLength={500} placeholder="What does your company do? What kind of talent do you typically hire?" />
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-2xl border-border/60 space-y-4">
        <h2 className="font-semibold text-lg">Social &amp; contact</h2>
        <p className="text-xs text-muted-foreground">LinkedIn and Instagram are always visible. Contact number and email are shown only to students you hire.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>LinkedIn URL</Label>
            <Input className="text-base" value={p.linkedin_url} onChange={(e) => setP({ ...p, linkedin_url: e.target.value })} placeholder="https://linkedin.com/company/..." />
          </div>
          <div className="space-y-1.5">
            <Label>Instagram URL</Label>
            <Input className="text-base" value={p.instagram_url} onChange={(e) => setP({ ...p, instagram_url: e.target.value })} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label>Contact number</Label>
            <Input className="text-base" type="tel" value={p.contact_number} onChange={(e) => setP({ ...p, contact_number: e.target.value })} placeholder="+92 300 1234567" />
          </div>
          <div className="space-y-1.5">
            <Label>Contact email</Label>
            <Input className="text-base" type="email" value={p.contact_email} onChange={(e) => setP({ ...p, contact_email: e.target.value })} placeholder="hiring@yourcompany.com" />
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving} size="lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save profile
        </Button>
        <DeleteActionButton
          title="Delete company profile?"
          description="This removes only the company profile row. Your login account remains active and you can rebuild the profile by saving this page again."
          confirmLabel="Delete profile"
          variant="outline"
          size="lg"
          onConfirm={deleteProfile}
        >
          Delete profile
        </DeleteActionButton>
      </div>
    </div>
  );
};

export default CompanyProfile;
