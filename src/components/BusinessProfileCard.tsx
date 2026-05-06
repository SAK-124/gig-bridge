import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Globe, Linkedin, Instagram, Star, Phone, Mail, Loader2 } from "lucide-react";

interface Props {
  businessId: string;
  currentStudentId?: string;
}

export const BusinessProfileCard = ({ businessId, currentStudentId }: Props) => {
  const [profile, setProfile] = useState<any>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isHired, setIsHired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    const fetches: Promise<any>[] = [
      supabase.from("profiles").select("*").eq("user_id", businessId).maybeSingle(),
      supabase.from("reviews").select("rating, review_text, created_at, reviewer_id").eq("reviewee_id", businessId).eq("reviewer_role", "student").order("created_at", { ascending: false }).limit(3),
    ];
    if (currentStudentId) {
      fetches.push(
        supabase.from("hires").select("id", { count: "exact", head: true }).eq("student_id", currentStudentId).eq("business_id", businessId).neq("status", "awaiting_payment")
      );
    }
    Promise.all(fetches).then(([profRes, reviewsRes, hiresRes]) => {
      setProfile(profRes.data);
      const revs = reviewsRes.data || [];
      setReviews(revs);
      if (revs.length > 0) {
        setAvgRating(revs.reduce((s: number, r: any) => s + r.rating, 0) / revs.length);
      }
      if (hiresRes) setIsHired((hiresRes.count || 0) > 0);
      setLoading(false);
    });
  }, [businessId, currentStudentId]);

  if (loading) return (
    <Card className="p-4 rounded-2xl border-border/60 flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </Card>
  );
  if (!profile) return null;

  return (
    <Card className="p-5 rounded-2xl border-border/60 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary font-display font-bold text-lg grid place-items-center flex-shrink-0">
          {(profile.company_name || profile.full_name || "B").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-base leading-tight">{profile.company_name || profile.full_name || "Business"}</div>
          {profile.full_name && profile.company_name && (
            <div className="text-xs text-muted-foreground mt-0.5">{profile.full_name}</div>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {profile.is_business_verified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/15 px-2 py-0.5 rounded-full">
                <BadgeCheck className="h-3.5 w-3.5" />Verified Business
              </span>
            )}
            {avgRating !== null && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-foreground bg-warning/15 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-current" />{avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            )}
          </div>
        </div>
      </div>

      {profile.company_description && (
        <p className="text-sm text-muted-foreground">{profile.company_description}</p>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-3 text-sm">
        {profile.company_website && (
          <a href={profile.company_website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
            <Globe className="h-4 w-4" />Website
          </a>
        )}
        {profile.linkedin_url && (
          <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
            <Linkedin className="h-4 w-4" />LinkedIn
          </a>
        )}
        {profile.instagram_url && (
          <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
            <Instagram className="h-4 w-4" />Instagram
          </a>
        )}
      </div>

      {/* Contact info — only shown after hiring */}
      {isHired && (profile.contact_number || profile.contact_email) && (
        <div className="border-t border-border/60 pt-3 space-y-1.5 text-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contact</div>
          {profile.contact_number && (
            <div className="flex items-center gap-2 text-foreground/80">
              <Phone className="h-4 w-4 text-muted-foreground" />{profile.contact_number}
            </div>
          )}
          {profile.contact_email && (
            <div className="flex items-center gap-2 text-foreground/80">
              <Mail className="h-4 w-4 text-muted-foreground" />{profile.contact_email}
            </div>
          )}
        </div>
      )}
      {!isHired && (profile.contact_number || profile.contact_email) && (
        <p className="text-xs text-muted-foreground italic">Contact details visible after hiring confirmation.</p>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="border-t border-border/60 pt-3 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent reviews</div>
          {reviews.map((r: any, i: number) => (
            <div key={i} className="bg-muted/40 rounded-xl p-3 text-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`h-3.5 w-3.5 ${j < r.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                ))}
              </div>
              {r.review_text && <p className="text-foreground/80">{r.review_text}</p>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
