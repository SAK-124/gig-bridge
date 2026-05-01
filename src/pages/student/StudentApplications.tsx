import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

const StudentApplications = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("applications").select("id, status, created_at, cover_letter, gigs(title, budget)").eq("student_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setApps(data || []);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary">My applications</h1>
        <p className="text-muted-foreground">Track every gig you've applied to.</p>
      </div>
      {loading ? <Skeleton className="h-40 rounded-2xl" /> : apps.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl text-muted-foreground">You haven't applied to any gigs yet.</Card>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <Card key={a.id} className="p-5 rounded-2xl border-border/60 flex flex-wrap justify-between items-start gap-3">
              <div>
                <div className="font-semibold">{a.gigs?.title}</div>
                <div className="text-xs text-muted-foreground mt-1">Applied {new Date(a.created_at).toLocaleDateString()}</div>
              </div>
              <StatusBadge status={a.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default StudentApplications;
