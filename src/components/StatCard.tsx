import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const StatCard = ({ label, value, icon: Icon, loading }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; loading?: boolean }) => (
  <Card className="p-5 rounded-2xl border-border/60 shadow-card">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="h-9 w-9 rounded-xl bg-primary-soft flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </div>
    {loading ? <Skeleton className="h-8 w-20" /> : <div className="font-display text-3xl font-bold text-secondary">{value}</div>}
  </Card>
);
