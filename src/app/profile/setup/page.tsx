import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isEmailVerified, needsProfileSetup } from "@/lib/auth";
import { profileToFormValues, type ProfileFormValues } from "@/components/profile-form";
import { ProfileSetupForm } from "./profile-setup-form";

export default async function ProfileSetupPage() {
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

  if (!needsProfileSetup(profile)) redirect("/profile");

  const emptyValues: ProfileFormValues = {
    fullName: "",
    bio: "",
    gender: "",
    danceRole: "",
    age: "",
  };

  const initialValues = profile
    ? profileToFormValues(profile)
    : emptyValues;

  return (
    <div className="mx-auto max-w-lg">
      <ProfileSetupForm userId={user.id} initialValues={initialValues} />
    </div>
  );
}
