#!/usr/bin/env node
// Promote a Supabase auth user to admin role.
// Usage:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/promote-admin.mjs <email>
//
// Requirements:
//   - The email must already exist as a Supabase auth user (user signed up first).
//   - SUPABASE_SERVICE_ROLE_KEY is the service-role key from your Supabase dashboard
//     (Settings → API). Never commit this. Treat it like a database password.
//
// What it does:
//   1. Finds the auth.users row by email.
//   2. Upserts {user_id, role: 'admin'} into public.user_roles.
//   3. Prints the user id on success.

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var.");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promote-admin.mjs <email>");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

let foundUser = null;
let page = 1;
while (page <= 50) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("listUsers failed:", error.message);
    process.exit(1);
  }
  foundUser = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
  if (foundUser) break;
  if (data.users.length < 200) break;
  page += 1;
}

if (!foundUser) {
  console.error(`No auth user found for ${email}. Ask them to sign up first.`);
  process.exit(1);
}

const { error: roleErr } = await admin
  .from("user_roles")
  .upsert({ user_id: foundUser.id, role: "admin" }, { onConflict: "user_id,role" });

if (roleErr) {
  console.error("Role upsert failed:", roleErr.message);
  process.exit(1);
}

console.log(`Promoted ${email} (${foundUser.id}) to admin.`);
