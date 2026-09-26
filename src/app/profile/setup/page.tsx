import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { needsProfileSetup, getPostLoginPath } from "@/lib/auth";
import { profileSetupFormValues, EMPTY_PROFILE_FORM_VALUES } from "@/lib/profile";
import { ProfileSetupForm } from "./profile-setup-form";

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!needsProfileSetup(profile)) redirect("/");

  const initialValues = profile
    ? profileSetupFormValues(profile)
    : EMPTY_PROFILE_FORM_VALUES;

  const redirectPath = getPostLoginPath(
    profile ? { ...profile, profile_completed: true } : null
  );

  return (
    <div className="mx-auto max-w-lg">
      <ProfileSetupForm
        userId={user.id}
        initialValues={initialValues}
        redirectPath={redirectPath}
      />
    </div>
  );
}
