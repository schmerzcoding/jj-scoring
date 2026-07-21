import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PasswordForm } from "@/components/password-form";

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!user.email) redirect("/profile");

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link
        href="/profile"
        className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
      >
        &larr; Back to profile
      </Link>
      <Card
        title="Change password"
        description="Enter your current password and choose a new one."
      >
        <PasswordForm mode="change" email={user.email} />
      </Card>
    </div>
  );
}
