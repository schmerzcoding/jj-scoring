import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AdminSupabase = SupabaseClient<Database>;

export function generateQrToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function ensureTicketQrToken(
  admin: AdminSupabase,
  purchaseId: string
): Promise<string | null> {
  const { data: purchase } = await admin
    .from("ticket_purchases")
    .select("qr_token, status")
    .eq("id", purchaseId)
    .single();

  if (!purchase || purchase.status !== "paid") {
    return null;
  }

  if (purchase.qr_token) {
    return purchase.qr_token;
  }

  const qrToken = generateQrToken();
  const { data: updated, error } = await admin
    .from("ticket_purchases")
    .update({ qr_token: qrToken })
    .eq("id", purchaseId)
    .is("qr_token", null)
    .select("qr_token")
    .single();

  if (error) {
    console.error("Failed to assign QR token:", error);
    return null;
  }

  if (updated?.qr_token) {
    return updated.qr_token;
  }

  const { data: existing } = await admin
    .from("ticket_purchases")
    .select("qr_token")
    .eq("id", purchaseId)
    .single();

  return existing?.qr_token ?? null;
}
