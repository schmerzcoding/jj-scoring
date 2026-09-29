import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AdminSupabase = SupabaseClient<Database>;

const PASS_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassCode(): string {
  const bytes = randomBytes(8);
  let suffix = "";
  for (let index = 0; index < 8; index += 1) {
    suffix += PASS_CODE_CHARS[bytes[index]! % PASS_CODE_CHARS.length];
  }
  return `WS-${suffix}`;
}

export async function ensureTicketPassCode(
  admin: AdminSupabase,
  purchaseId: string
): Promise<string | null> {
  const { data: purchase } = await admin
    .from("ticket_purchases")
    .select("pass_code, status")
    .eq("id", purchaseId)
    .single();

  if (!purchase || purchase.status !== "paid") {
    return null;
  }

  if (purchase.pass_code) {
    return purchase.pass_code;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const passCode = generatePassCode();
    const { data: updated, error } = await admin
      .from("ticket_purchases")
      .update({ pass_code: passCode })
      .eq("id", purchaseId)
      .is("pass_code", null)
      .select("pass_code")
      .single();

    if (!error && updated?.pass_code) {
      return updated.pass_code;
    }

    if (error && !error.message.includes("duplicate")) {
      console.error("Failed to assign pass code:", error);
      return null;
    }
  }

  const { data: existing } = await admin
    .from("ticket_purchases")
    .select("pass_code")
    .eq("id", purchaseId)
    .single();

  return existing?.pass_code ?? null;
}
