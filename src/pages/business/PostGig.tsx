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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000),
  deliverables: z.string().trim().min(10, "Deliverables are required (at least 10 characters)").max(1000),
  acceptance_criteria: z.string().trim().min(10, "Acceptance criteria are required (at least 10 characters)").max(1000),
  budget: z.number().positive("Budget must be positive").max(10_000_000),
});

const PostGig = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [f, setF] = useState({
    title: "",
    category: "",
    location: "remote",
    slots: "1",
    description: "",
    purpose: "",
    target_audience: "",
    deliverables: "",
    file_format: "",
    source_files_needed: false,
    acceptance_criteria: "",
    style_references: "",
    technical_specs: "",
    rejection_criteria: "",
    scope_included: "",
    scope_excluded: "",
    revision_count: "2",
    extra_work_definition: "",
    start_date: "",
    deadline: "",
    milestones: "",
    review_window_days: "",
    budget: "",
    payment_type: "",
    release_condition: "",
    required_skills: "",
    experience_level: "",
    language_preference: "",
    assets_provided: "",
    assets_needed: "",
    assets_deadline: "",
    no_off_platform: true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = schema.safeParse({
      title: f.title,
      description: f.description,
      deliverables: f.deliverables,
      acceptance_criteria: f.acceptance_criteria,
      budget: parseFloat(f.budget),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    const brief = {
      purpose: f.purpose.trim() || null,
      target_audience: f.target_audience.trim() || null,
      file_format: f.file_format.trim() || null,
      source_files_needed: f.source_files_needed,
      style_references: f.style_references.trim() || null,
      technical_specs: f.technical_specs.trim() || null,
      rejection_criteria: f.rejection_criteria.trim() || null,
      scope_included: f.scope_included.trim() || null,
      scope_excluded: f.scope_excluded.trim() || null,
      revision_count: parseInt(f.revision_count) || 2,
      extra_work_definition: f.extra_work_definition.trim() || null,
      start_date: f.start_date || null,
      milestones: f.milestones.trim() || null,
      review_window_days: f.review_window_days ? parseInt(f.review_window_days) : null,
      payment_type: f.payment_type || null,
      release_condition: f.release_condition.trim() || null,
      experience_level: f.experience_level || null,
      language_preference: f.language_preference.trim() || null,
      assets_provided: f.assets_provided.trim() || null,
      assets_needed: f.assets_needed.trim() || null,
      assets_deadline: f.assets_deadline || null,
      no_off_platform: f.no_off_platform,
    };

    setSaving(true);
    const { error } = await supabase.from("gigs").insert({
      business_id: user.id,
      title: f.title.trim(),
      category: f.category.trim() || null,
      description: f.description.trim(),
      deliverables: f.deliverables.trim(),
      acceptance_criteria: f.acceptance_criteria.trim(),
      brief,
      required_skills: f.required_skills ? f.required_skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      budget: parseFloat(f.budget),
      deadline: f.deadline || null,
      location: f.location as "remote" | "onsite" | "hybrid",
      slots: parseInt(f.slots) || 1,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Gig posted!");
    navigate("/business");
  };

  const field = (label: string, id: string, children: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">Post a gig</h1>
        <p className="text-muted-foreground">Fill out the brief carefully — clear expectations mean fewer disputes.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Accordion type="multiple" defaultValue={["basic", "brief", "deliverables", "quality", "payment"]} className="space-y-3">

          {/* Section 1 — Basic Info */}
          <AccordionItem value="basic" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">1. Basic Info</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {field("Gig title *", "title",
                <Input id="title" className="text-base" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required placeholder="e.g. Logo design for fashion brand" />
              )}
              {field("Category", "category",
                <Input id="category" className="text-base" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Design, Writing, Tutoring, Development…" />
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
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
                {field("Number of students", "slots",
                  <Input id="slots" type="number" min="1" className="text-base" value={f.slots} onChange={(e) => setF({ ...f, slots: e.target.value })} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2 — Task Brief */}
          <AccordionItem value="brief" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">2. Task Brief *</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {field("What needs to be done? *", "description",
                <Textarea id="description" rows={4} className="text-base" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required maxLength={2000} placeholder="Describe the overall task in plain language." />
              )}
              {field("Purpose of the work (optional)", "purpose",
                <Textarea id="purpose" rows={2} className="text-base" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} maxLength={500} placeholder="Why is this work needed? What problem does it solve?" />
              )}
              {field("Target audience / final use (optional)", "target_audience",
                <Input id="target_audience" className="text-base" value={f.target_audience} onChange={(e) => setF({ ...f, target_audience: e.target.value })} placeholder="e.g. Pakistani university students aged 18-24" />
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Section 3 — Deliverables */}
          <AccordionItem value="deliverables" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">3. Deliverables *</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {field("Exact output required *", "deliverables",
                <Textarea id="deliverables" rows={3} className="text-base" value={f.deliverables} onChange={(e) => setF({ ...f, deliverables: e.target.value })} required maxLength={1000} placeholder="e.g. 3 logo variations in PNG and SVG, 1 brand colour palette PDF" />,
                "Be specific — what files, formats, or outputs will you receive?"
              )}
              {field("File format (optional)", "file_format",
                <Input id="file_format" className="text-base" value={f.file_format} onChange={(e) => setF({ ...f, file_format: e.target.value })} placeholder="e.g. PNG, SVG, DOCX, MP4" />
              )}
              <div className="flex items-center gap-2">
                <Checkbox id="source_files" checked={f.source_files_needed} onCheckedChange={(v) => setF({ ...f, source_files_needed: !!v })} />
                <Label htmlFor="source_files" className="cursor-pointer">Source / editable files required (e.g. .AI, .PSD, .DOCX)</Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 4 — Quality Criteria */}
          <AccordionItem value="quality" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">4. Quality &amp; Acceptance Criteria *</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {field("What counts as complete? *", "acceptance_criteria",
                <Textarea id="acceptance_criteria" rows={3} className="text-base" value={f.acceptance_criteria} onChange={(e) => setF({ ...f, acceptance_criteria: e.target.value })} required maxLength={1000} placeholder="e.g. Logo looks professional, matches brand colours, all formats delivered and editable" />,
                "This is used to resolve disputes — be precise."
              )}
              {field("Style / reference examples (optional)", "style_references",
                <Input id="style_references" className="text-base" value={f.style_references} onChange={(e) => setF({ ...f, style_references: e.target.value })} placeholder="e.g. https://behance.net/... or describe the style" />
              )}
              {field("Technical specs (optional)", "technical_specs",
                <Input id="technical_specs" className="text-base" value={f.technical_specs} onChange={(e) => setF({ ...f, technical_specs: e.target.value })} placeholder="e.g. 1080×1080px, 300 DPI, RGB colour" />
              )}
              {field("What will be rejected? (optional)", "rejection_criteria",
                <Textarea id="rejection_criteria" rows={2} className="text-base" value={f.rejection_criteria} onChange={(e) => setF({ ...f, rejection_criteria: e.target.value })} maxLength={500} placeholder="e.g. Clipart, stock photos, AI-only generation without customisation" />
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Section 5 — Scope Control */}
          <AccordionItem value="scope" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">5. Scope Control (optional)</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {field("What is included", "scope_included",
                <Textarea id="scope_included" rows={2} className="text-base" value={f.scope_included} onChange={(e) => setF({ ...f, scope_included: e.target.value })} maxLength={500} placeholder="e.g. Up to 3 logo concepts, 2 revision rounds" />
              )}
              {field("What is NOT included", "scope_excluded",
                <Textarea id="scope_excluded" rows={2} className="text-base" value={f.scope_excluded} onChange={(e) => setF({ ...f, scope_excluded: e.target.value })} maxLength={500} placeholder="e.g. Brand guidelines document, social media kit" />
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {field("Number of revisions", "revision_count",
                  <Input id="revision_count" type="number" min="0" className="text-base" value={f.revision_count} onChange={(e) => setF({ ...f, revision_count: e.target.value })} />
                )}
              </div>
              {field("What counts as extra work (optional)", "extra_work",
                <Input id="extra_work" className="text-base" value={f.extra_work_definition} onChange={(e) => setF({ ...f, extra_work_definition: e.target.value })} placeholder="e.g. More than 3 logo concepts or additional formats" />
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Section 6 — Timeline */}
          <AccordionItem value="timeline" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">6. Timeline (optional)</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {field("Start date", "start_date",
                  <Input id="start_date" type="date" className="text-base" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
                )}
                {field("Submission deadline", "deadline",
                  <Input id="deadline" type="date" className="text-base" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
                )}
                {field("Employer review window (days)", "review_window",
                  <Input id="review_window" type="number" min="1" className="text-base" value={f.review_window_days} onChange={(e) => setF({ ...f, review_window_days: e.target.value })} placeholder="e.g. 3" />
                )}
              </div>
              {field("Milestones (optional)", "milestones",
                <Textarea id="milestones" rows={2} className="text-base" value={f.milestones} onChange={(e) => setF({ ...f, milestones: e.target.value })} maxLength={500} placeholder="e.g. Concepts by Day 5, final by Day 10" />
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Section 7 — Payment */}
          <AccordionItem value="payment" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">7. Payment *</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {field("Budget (PKR) *", "budget",
                <Input id="budget" type="number" min="1" className="text-base" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} required placeholder="e.g. 5000" />
              )}
              <div className="space-y-1.5">
                <Label>Payment type (optional)</Label>
                <Select value={f.payment_type} onValueChange={(v) => setF({ ...f, payment_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed price</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="milestone">Per milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {field("Release condition (optional)", "release_condition",
                <Input id="release_condition" className="text-base" value={f.release_condition} onChange={(e) => setF({ ...f, release_condition: e.target.value })} placeholder="e.g. Released after final file delivery and approval" />
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Section 8 — Requirements */}
          <AccordionItem value="requirements" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">8. Requirements (optional)</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {field("Required skills / tools (comma-separated)", "skills",
                <Input id="skills" className="text-base" value={f.required_skills} onChange={(e) => setF({ ...f, required_skills: e.target.value })} placeholder="e.g. Adobe Illustrator, Figma, Canva" />
              )}
              <div className="space-y-1.5">
                <Label>Experience level</Label>
                <Select value={f.experience_level} onValueChange={(v) => setF({ ...f, experience_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Any level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {field("Language / university preference (optional)", "lang_pref",
                <Input id="lang_pref" className="text-base" value={f.language_preference} onChange={(e) => setF({ ...f, language_preference: e.target.value })} placeholder="e.g. English fluency required, LUMS students preferred" />
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Section 9 — Business Inputs */}
          <AccordionItem value="inputs" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">9. Business Inputs (optional)</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              {field("Assets / materials provided by you", "assets_provided",
                <Textarea id="assets_provided" rows={2} className="text-base" value={f.assets_provided} onChange={(e) => setF({ ...f, assets_provided: e.target.value })} maxLength={500} placeholder="e.g. Brand guidelines, existing logo, product photos" />
              )}
              {field("Access / details needed from student", "assets_needed",
                <Input id="assets_needed" className="text-base" value={f.assets_needed} onChange={(e) => setF({ ...f, assets_needed: e.target.value })} placeholder="e.g. Canva login credentials will be shared" />
              )}
              {field("Deadline to provide assets", "assets_deadline",
                <Input id="assets_deadline" type="date" className="text-base" value={f.assets_deadline} onChange={(e) => setF({ ...f, assets_deadline: e.target.value })} />
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Section 10 — Dispute Rules */}
          <AccordionItem value="rules" className="border border-border/60 rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="py-4 font-semibold">10. Platform Rules</AccordionTrigger>
            <AccordionContent className="pb-5 space-y-4">
              <Card className="p-4 bg-muted/40 border-border/60 rounded-xl text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Gig Bridge Dispute Policy
                </div>
                <p>
                  Employers fund the gig before work starts. Students are paid when the agreed deliverables are submitted and approved.
                  If there is a disagreement, Gig Bridge reviews the original gig brief, submitted work, chat history, and evidence from both sides.
                  Payment may be released, refunded, or sent back for revision depending on whether the agreed scope was completed.
                </p>
              </Card>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="rule_criteria" checked disabled />
                  <Label htmlFor="rule_criteria" className="text-sm">Acceptance criteria locked before work starts (always on)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="rule_no_off" checked={f.no_off_platform} onCheckedChange={(v) => setF({ ...f, no_off_platform: !!v })} />
                  <Label htmlFor="rule_no_off" className="cursor-pointer text-sm">No off-platform dealing — all communication and payments through Gig Bridge</Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Post Gig
        </Button>
      </form>
    </div>
  );
};

export default PostGig;
