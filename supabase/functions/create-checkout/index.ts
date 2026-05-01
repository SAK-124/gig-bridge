import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_DOMAIN = "gig-bridge-8xpb5.myshopify.com";
const SHOPIFY_STOREFRONT_TOKEN = "1172bcc30a2bf7a7c1244abad6e84fa4";
const SHOPIFY_API_VERSION = "2025-07";

interface CheckoutBody {
  hire_id: string;
  gig_title: string;
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

    const body = (await req.json()) as CheckoutBody;
    if (!body.hire_id || !body.total || body.total <= 0) return json({ error: "Invalid request" }, 400);

    // 1) Create a one-off product in Shopify for this hire
    const adminToken = Deno.env.get("SHOPIFY_ADMIN_TOKEN");
    let variantGid: string | null = null;

    if (adminToken) {
      const productRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
        body: JSON.stringify({
          query: `mutation prodCreate($input: ProductInput!) {
            productCreate(input: $input) {
              product { id variants(first:1) { edges { node { id } } } }
              userErrors { field message }
            }
          }`,
          variables: {
            input: {
              title: `Gig Bridge: ${body.gig_title}`,
              status: "ACTIVE",
              variants: [{ price: body.total.toFixed(2), inventoryPolicy: "CONTINUE", requiresShipping: false, taxable: false }],
            },
          },
        }),
      });
      const productData = await productRes.json();
      variantGid = productData?.data?.productCreate?.product?.variants?.edges?.[0]?.node?.id ?? null;
    }

    let checkoutUrl: string | null = null;

    if (variantGid) {
      // Create cart with that variant
      const cartRes = await fetch(`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN },
        body: JSON.stringify({
          query: `mutation cartCreate($input: CartInput!) {
            cartCreate(input: $input) {
              cart { id checkoutUrl }
              userErrors { message }
            }
          }`,
          variables: { input: { lines: [{ quantity: 1, merchandiseId: variantGid }], note: `Hire ${body.hire_id}` } },
        }),
      });
      const cartData = await cartRes.json();
      const url = cartData?.data?.cartCreate?.cart?.checkoutUrl;
      if (url) {
        const u = new URL(url);
        u.searchParams.set("channel", "online_store");
        checkoutUrl = u.toString();
      }
    }

    // Persist payment row regardless (admin can mark received manually if checkout not available)
    await supabase.from("payments").insert({
      hire_id: body.hire_id,
      gig_amount: body.gig_amount,
      platform_fee: body.platform_fee,
      total_amount: body.total,
      currency: "PKR",
      shopify_checkout_url: checkoutUrl,
      status: "awaiting",
    });

    return json({ checkoutUrl });
  } catch (e) {
    console.error("create-checkout error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
