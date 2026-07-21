import type { SupabaseClient } from "@supabase/supabase-js";

export async function verifyCurrentPassword(
  supabase: SupabaseClient,
  email: string,
  currentPassword: string
): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  return !error;
}

/** Uses a sign-in probe — only for recovery when the current password is unknown to the client. */
export async function isSameAsExistingPassword(
  supabase: SupabaseClient,
  email: string,
  candidatePassword: string
): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: candidatePassword,
  });
  return !error;
}

export async function updateUserPassword(
  supabase: SupabaseClient,
  newPassword: string
): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error?.message ?? null;
}
