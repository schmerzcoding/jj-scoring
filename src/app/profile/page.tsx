import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchProfileCompetitionData } from "@/lib/profile-stats";
import {
  AchievementsSection,
  EnrollmentsSection,
  HistorySection,
  ProfileSummary,
} from "@/components/profile-dashboard";
import { ProfileEditForm } from "./profile-edit-form";

export default async function ProfilePage() {
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

  if (!profile) redirect("/profile/setup");

  const competitionData = await fetchProfileCompetitionData(supabase, user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <ProfileSummary
        fullName={profile.full_name}
        bio={profile.bio}
        danceRole={profile.dance_role}
        age={profile.age}
        gender={profile.gender}
      />

      <EnrollmentsSection enrollments={competitionData.enrollments} />
      <AchievementsSection achievements={competitionData.achievements} />
      <HistorySection history={competitionData.history} />

      <ProfileEditForm
        userId={user.id}
        email={user.email ?? ""}
        profile={profile}
      />
    </div>
  );
}
