import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateAccountBody = {
  full_name: string;
  email: string;
  password: string;
  role: "student" | "business";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Partial<CreateAccountBody>;
    if (!body.full_name || !body.email || !body.password || !body.role) {
      return json({ error: "Missing required fields" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existingUser = existing?.users.find((u) => u.email?.toLowerCase() === body.email!.toLowerCase());
    if (existingUser) {
      await admin.auth.admin.updateUserById(existingUser.id, {
        password: body.password,
        email_confirm: true,
        user_metadata: { full_name: body.full_name, role: body.role },
      });
      await admin.from("user_roles").upsert(
        { user_id: existingUser.id, role: body.role },
        { onConflict: "user_id" },
      );
      return json({ email: body.email, password: body.password });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name, role: body.role },
    });
    if (error || !data.user) return json({ error: error?.message ?? "Failed to create account" }, 400);

    await admin.from("user_roles").upsert(
      { user_id: data.user.id, role: body.role },
      { onConflict: "user_id" },
    );
    return json({ email: body.email, password: body.password });
  } catch (e) {
    console.error("create-account error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
