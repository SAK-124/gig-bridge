import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InitiateBody {
  hire_id: string;
  gig_amount: number;
  platform_fee: number;
  total: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as InitiateBody;
    if (!body.hire_id || !body.total || body.total <= 0) {
      return json({ error: "Invalid request" }, 400);
    }

    const { data: hire, error: hireErr } = await supabase
      .from("hires")
      .select("id, business_id")
      .eq("id", body.hire_id)
      .maybeSingle();
    if (hireErr) return json({ error: hireErr.message }, 400);
    if (!hire || hire.business_id !== user.id) return json({ error: "Hire not found or not yours" }, 403);

    const { data: existing } = await supabase
      .from("payments")
      .select("id, status")
      .eq("hire_id", body.hire_id)
      .maybeSingle();

    let paymentId = existing?.id as string | undefined;
    if (!paymentId) {
      const { data: inserted, error: insErr } = await supabase
        .from("payments")
        .insert({
          hire_id: body.hire_id,
          gig_amount: body.gig_amount,
          platform_fee: body.platform_fee,
          total_amount: body.total,
          currency: "PKR",
          status: "awaiting",
        })
        .select("id")
        .single();
      if (insErr) return json({ error: insErr.message }, 400);
      paymentId = inserted.id;
    }

    const { data: bank } = await supabase
      .from("platform_bank_accounts")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    return json({
      paymentId,
      bankAccount: bank,
      transferReference: `GB-${body.hire_id.slice(0, 8).toUpperCase()}`,
      total: body.total,
      gigAmount: body.gig_amount,
      platformFee: body.platform_fee,
    });
  } catch (e) {
    console.error("initiate-payment error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
