import { supabase } from "@/integrations/supabase/client";

export async function fetchProfileMap(userIds: string[], columns: string) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueIds.length) return new Map<string, any>();

  const { data, error } = await supabase
    .from("profiles")
    .select(`user_id, ${columns}`)
    .in("user_id", uniqueIds);

  if (error || !data) return new Map<string, any>();
  return new Map(data.map((row) => [row.user_id, row]));
}
