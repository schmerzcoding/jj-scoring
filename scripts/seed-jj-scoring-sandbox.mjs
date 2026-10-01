/**
 * Creates a hidden J&J scoring sandbox: 1 draft competition + 24 test dancers.
 *
 * Requirements (.env.local or env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   SANDBOX_ADMIN_USER_ID — profile UUID that owns the event (defaults to first admin)
 *
 * Run:
 *   node scripts/seed-jj-scoring-sandbox.mjs
 *
 * Cleanup:
 *   node scripts/seed-jj-scoring-sandbox.mjs --cleanup
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SANDBOX_NAME = "[SANDBOX] J&J Scoring Rehearsal";
const SANDBOX_EMAIL_DOMAIN = "sandbox.jj-scoring.local";
const SANDBOX_PASSWORD = "SandboxTestOnly123!";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (add to .env.local)."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAdminUserId() {
  if (process.env.SANDBOX_ADMIN_USER_ID) {
    return process.env.SANDBOX_ADMIN_USER_ID;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    throw new Error("No admin profile found. Set SANDBOX_ADMIN_USER_ID.");
  }
  return data.id;
}

async function cleanupSandbox() {
  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name")
    .like("name", "[SANDBOX]%");

  if (!competitions?.length) {
    console.log("No sandbox competitions found.");
  } else {
    for (const comp of competitions) {
      const { error } = await supabase.from("competitions").delete().eq("id", comp.id);
      if (error) throw error;
      console.log(`Deleted competition: ${comp.name} (${comp.id})`);
    }
  }

  let page = 1;
  let deletedUsers = 0;
  while (true) {
    const { data: list, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const sandboxUsers =
      list.users?.filter((u) => u.email?.endsWith(`@${SANDBOX_EMAIL_DOMAIN}`)) ?? [];
    if (!sandboxUsers.length && (list.users?.length ?? 0) === 0) break;

    for (const user of sandboxUsers) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) throw delErr;
      deletedUsers += 1;
    }

    if ((list.users?.length ?? 0) < 200) break;
    page += 1;
  }

  console.log(`Deleted ${deletedUsers} sandbox auth users.`);
}

async function ensureTestUser(email, fullName) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: SANDBOX_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "participant" },
  });

  if (!createError && created.user) {
    return created.user.id;
  }

  const message = createError?.message?.toLowerCase() ?? "";
  if (!message.includes("already") && !message.includes("exists")) {
    throw createError ?? new Error(`Could not create ${email}`);
  }

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;
  const existing = list.users?.find((u) => u.email === email);
  if (!existing) throw new Error(`User exists but could not resolve: ${email}`);
  return existing.id;
}

async function seedSandbox() {
  const adminId = await findAdminUserId();

  const { data: existing } = await supabase
    .from("competitions")
    .select("id, name")
    .eq("name", SANDBOX_NAME)
    .maybeSingle();

  if (existing) {
    console.log("\nSandbox already exists:");
    console.log(`  Name: ${existing.name}`);
    console.log(`  ID:   ${existing.id}`);
    console.log(`  Admin: /admin/competitions/${existing.id}`);
    console.log("\nUse --cleanup first to recreate, or continue with this event.");
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: competition, error: compError } = await supabase
    .from("competitions")
    .insert({
      name: SANDBOX_NAME,
      description:
        "Internal scoring rehearsal. Hidden from public listings. Safe to delete after testing.",
      status: "draft",
      registration_open: false,
      location: "Private rehearsal",
      event_date: today,
      event_type: "competition",
      leader_price_cents: null,
      follower_price_cents: null,
      ticket_price_cents: null,
      created_by: adminId,
    })
    .select("id")
    .single();

  if (compError || !competition) {
    throw compError ?? new Error("Failed to create sandbox competition");
  }

  const registrations = [];

  for (let i = 1; i <= 12; i += 1) {
    const num = String(i).padStart(2, "0");
    const roles = [
      { role: "leader", label: "Leader" },
      { role: "follower", label: "Follower" },
    ];

    for (const { role, label } of roles) {
      const index = role === "leader" ? i : i;
      const displayName = `Sandbox ${label} ${num}`;
      const email = `sandbox-${role}-${num}@${SANDBOX_EMAIL_DOMAIN}`;

      const userId = await ensureTestUser(email, displayName);

      await supabase
        .from("profiles")
        .update({ profile_completed: true, dance_role: role })
        .eq("id", userId);

      registrations.push({
        competition_id: competition.id,
        user_id: userId,
        role,
        status: "approved",
        display_name: displayName,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      });
    }
  }

  const { error: regError } = await supabase.from("registrations").insert(registrations);
  if (regError) throw regError;

  console.log("\nSandbox created successfully.\n");
  console.log(`  Competition ID: ${competition.id}`);
  console.log(`  Admin panel:    /admin/competitions/${competition.id}`);
  console.log(`  Status:         draft (hidden from Events page)`);
  console.log(`  Dancers:        12 leaders + 12 followers (approved, no payment)`);
  console.log("\nNext steps:");
  console.log("  1. Assign your 5 judges (leader/follower roles) in the Judges panel.");
  console.log("  2. Add rounds (Placement / Crossed placement) and set advancement.");
  console.log("  3. Activate a round — judges score at /judge");
  console.log("  4. When finished: node scripts/seed-jj-scoring-sandbox.mjs --cleanup");
}

const cleanup = process.argv.includes("--cleanup");

try {
  if (cleanup) {
    await cleanupSandbox();
  } else {
    await seedSandbox();
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}
