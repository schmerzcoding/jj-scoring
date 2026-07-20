import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isEmailVerified } from "@/lib/auth";
import { ProfileEditForm } from "./profile-edit-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isEmailVerified(user)) redirect("/verify-email");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/profile/setup");

  return (
    <div className="mx-auto max-w-lg">
      <ProfileEditForm
        userId={user.id}
        email={user.email ?? ""}
        profile={profile}
      />
    </div>
  );
}
