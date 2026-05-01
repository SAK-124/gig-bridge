import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(5).max(120),
  category: z.string().trim().max(60).optional(),
  description: z.string().trim().min(20).max(2000),
  budget: z.number().positive().max(10_000_000),
});

const PostGig = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ title: "", category: "", description: "", required_skills: "", budget: "", deadline: "", location: "remote", slots: "1", attachments: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ title: f.title, category: f.category, description: f.description, budget: parseFloat(f.budget) });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { error } = await supabase.from("gigs").insert({
      business_id: user.id,
      title: f.title.trim(),
      category: f.category.trim() || null,
      description: f.description.trim(),
      required_skills: f.required_skills ? f.required_skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      attachments: f.attachments ? f.attachments.split(",").map(s => s.trim()).filter(Boolean) : [],
      budget: parseFloat(f.budget),
      deadline: f.deadline || null,
      location: f.location as any,
      slots: parseInt(f.slots) || 1,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Gig posted!");
    navigate("/business");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Post a gig</h1>
        <p className="text-muted-foreground">Describe what you need. Students will apply.</p>
      </div>
      <Card className="p-6 rounded-2xl border-border/60">
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Gig title *</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></div>
          <div><Label>Category</Label><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Design, Writing, Tutoring..." /></div>
          <div><Label>Description *</Label><Textarea rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required maxLength={2000} /></div>
          <div><Label>Required skills (comma-separated)</Label><Input value={f.required_skills} onChange={(e) => setF({ ...f, required_skills: e.target.value })} /></div>
          <div><Label>Attachments or reference links (comma-separated)</Label><Input value={f.attachments} onChange={(e) => setF({ ...f, attachments: e.target.value })} placeholder="https://drive.google.com/..., https://..." /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Budget (PKR) *</Label><Input type="number" min="1" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} required /></div>
            <div><Label>Deadline</Label><Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></div>
            <div>
              <Label>Location</Label>
              <Select value={f.location} onValueChange={(v) => setF({ ...f, location: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Number of students</Label><Input type="number" min="1" value={f.slots} onChange={(e) => setF({ ...f, slots: e.target.value })} /></div>
          </div>
          <Button type="submit" size="lg" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post Gig</Button>
        </form>
      </Card>
    </div>
  );
};

export default PostGig;
