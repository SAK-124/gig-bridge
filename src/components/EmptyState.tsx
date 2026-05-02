import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Props = {
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCtaClick?: () => void;
  className?: string;
};

export const EmptyState = ({ illustration, title, description, ctaLabel, ctaTo, onCtaClick, className = "" }: Props) => (
  <Card className={`p-10 md:p-12 text-center rounded-2xl border-border/60 ${className}`}>
    {illustration && <div className="mx-auto max-w-[280px] mb-5 opacity-95">{illustration}</div>}
    <h3 className="font-display text-xl md:text-2xl font-semibold text-secondary mb-1">{title}</h3>
    {description && <p className="text-muted-foreground max-w-md mx-auto">{description}</p>}
    {ctaLabel && (
      <div className="mt-5">
        {ctaTo ? (
          <Button asChild><Link to={ctaTo}>{ctaLabel}</Link></Button>
        ) : (
          <Button onClick={onCtaClick}>{ctaLabel}</Button>
        )}
      </div>
    )}
  </Card>
);
