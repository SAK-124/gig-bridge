import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Building2, Clock } from "lucide-react";
import { formatPKR } from "@/lib/payments";

export type GigCardData = {
  id: string;
  title: string;
  category?: string | null;
  description: string;
  budget: number | string;
  deadline?: string | null;
  location: string;
  required_skills?: string[] | null;
  business_id?: string;
  company_name?: string | null;
};

type Props = {
  gig: GigCardData;
  to?: string;
  ctaLabel?: string;
  compact?: boolean;
};

function daysFromNow(deadline?: string | null) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (days < 0) return "Past due";
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  if (days < 7) return `${days} days left`;
  if (days < 30) return `${Math.ceil(days / 7)} weeks left`;
  return `${Math.ceil(days / 30)} mo left`;
}

function categoryAccent(category?: string | null): string {
  const c = (category || "").toLowerCase();
  if (c.includes("design")) return "bg-accent/20 text-accent-foreground border-accent/40";
  if (c.includes("dev") || c.includes("data")) return "bg-primary/15 text-primary border-primary/40";
  if (c.includes("write") || c.includes("translation")) return "bg-success/15 text-success border-success/40";
  if (c.includes("tutor") || c.includes("research")) return "bg-secondary/15 text-secondary border-secondary/40";
  if (c.includes("video") || c.includes("photo") || c.includes("social")) return "bg-warning/15 text-warning-foreground border-warning/40";
  return "bg-muted text-muted-foreground border-border";
}

function avatarLetter(s?: string | null): string {
  if (!s) return "B";
  return s.trim().charAt(0).toUpperCase() || "B";
}

export const GigCard = ({ gig, to, ctaLabel = "View & apply", compact = false }: Props) => {
  const skills = (gig.required_skills || []).slice(0, 4);
  const more = (gig.required_skills?.length || 0) - skills.length;
  const dueIn = daysFromNow(gig.deadline);

  return (
    <Card className="group p-5 rounded-2xl border-border/60 hover:shadow-lift hover:-translate-y-0.5 transition-smooth bg-card">
      <div className="flex items-start gap-3 mb-3">
        <div className="grid place-items-center h-10 w-10 rounded-xl bg-secondary/10 text-secondary font-display font-bold">
          {avatarLetter(gig.company_name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{gig.title}</h3>
          {gig.company_name && (
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Building2 className="h-3 w-3" />{gig.company_name}
            </div>
          )}
        </div>
        <span className="font-display text-lg text-primary font-bold whitespace-nowrap">{formatPKR(gig.budget)}</span>
      </div>

      {gig.category && (
        <Badge variant="outline" className={`mb-3 ${categoryAccent(gig.category)}`}>{gig.category}</Badge>
      )}

      {!compact && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{gig.description}</p>}

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{gig.location}</span>
        {gig.deadline && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(gig.deadline).toLocaleDateString()}</span>}
        {dueIn && <span className="flex items-center gap-1 text-accent-foreground"><Clock className="h-3.5 w-3.5" />{dueIn}</span>}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.map((s) => <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>)}
          {more > 0 && <Badge variant="outline" className="text-xs">+{more}</Badge>}
        </div>
      )}

      {to && (
        <Button asChild className="w-full"><Link to={to}>{ctaLabel}</Link></Button>
      )}
    </Card>
  );
};
