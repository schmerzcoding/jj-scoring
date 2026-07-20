import { createClient } from "@/lib/supabase/server";
import { isEmailVerified } from "@/lib/auth";
import { VerifyEmailPanel } from "./verify-email-panel";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email: queryEmail } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-md">
      <VerifyEmailPanel
        email={user?.email ?? queryEmail}
        verified={user ? isEmailVerified(user) : false}
      />
    </div>
  );
}
