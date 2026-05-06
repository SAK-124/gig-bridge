import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, BadgeCheck, ExternalLink, FileText, Star } from "lucide-react";

interface Props {
  studentId: string;
  open: boolean;
  onClose: () => void;
}

export const StudentProfileSheet = ({ studentId, open, onClose }: Props) => {
  const [profile, setProfile] = useState<any>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [completedGigs, setCompletedGigs] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true);
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", studentId).maybeSingle(),
      supabase.from("reviews").select("rating").eq("reviewee_id", studentId).eq("reviewer_role", "business"),
      supabase.from("hires").select("id", { count: "exact", head: true }).eq("student_id", studentId).eq("status", "paid"),
    ]).then(([profRes, reviewRes, hiresRes]) => {
      setProfile(profRes.data);
      const reviews = reviewRes.data || [];
      setReviewCount(reviews.length);
      if (reviews.length > 0) {
        setAvgRating(reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length);
      } else {
        setAvgRating(null);
      }
      setCompletedGigs(hiresRes.count || 0);
      setLoading(false);
    });
  }, [open, studentId]);

  const resumeUrl = profile?.resume_url
    ? supabase.storage.from("resumes").getPublicUrl(profile.resume_url).data.publicUrl
    : null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Student profile</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : !profile ? (
          <p className="text-muted-foreground py-8">Profile not found.</p>
        ) : (
          <div className="space-y-5 mt-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary-soft text-primary font-display font-bold text-xl grid place-items-center flex-shrink-0">
                {(profile.full_name || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-lg leading-tight">{profile.full_name || "Student"}</div>
                {profile.university && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <GraduationCap className="h-3.5 w-3.5" />{profile.university}
                    {profile.degree && ` · ${profile.degree}`}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {profile.is_student_verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/15 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="h-3.5 w-3.5" />Verified Student
                    </span>
                  )}
                  {avgRating !== null && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-foreground bg-warning/15 px-2 py-0.5 rounded-full">
                      <Star className="h-3 w-3 fill-current" />{avgRating.toFixed(1)} ({reviewCount})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/40 rounded-xl p-3 text-center">
                <div className="font-bold text-xl">{completedGigs}</div>
                <div className="text-muted-foreground text-xs mt-0.5">Gigs completed</div>
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-center">
                <div className="font-bold text-xl">{avgRating ? avgRating.toFixed(1) : "—"}</div>
                <div className="text-muted-foreground text-xs mt-0.5">Avg. rating</div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">About</div>
                <p className="text-sm text-foreground/80">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Certifications</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.certifications.map((c: string) => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio links */}
            {profile.portfolio_links?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Portfolio</div>
                <div className="space-y-1">
                  {profile.portfolio_links.map((link: string, i: number) => (
                    <a key={i} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Resume */}
            {resumeUrl && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Resume</div>
                <Button asChild variant="outline" size="sm">
                  <a href={resumeUrl} target="_blank" rel="noreferrer">
                    <FileText className="h-4 w-4 mr-2" />Download resume
                  </a>
                </Button>
              </div>
            )}

            {/* Availability */}
            {profile.availability && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Availability</div>
                <p className="text-sm">{profile.availability}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
