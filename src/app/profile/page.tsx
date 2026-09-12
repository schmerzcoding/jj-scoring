import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/auth";
import { fetchProfileCompetitionData } from "@/lib/profile-stats";
import { fetchProfileTickets } from "@/lib/profile-tickets";
import {
  AchievementsSection,
  EnrollmentsSection,
  HistorySection,
} from "@/components/profile-dashboard";
import { MyEventsSection } from "@/components/my-events-section";
import { ProfileHeader } from "./profile-header";

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
  if (isAdminRole(profile.role)) redirect("/admin");

  const [competitionData, ticketData] = await Promise.all([
    fetchProfileCompetitionData(supabase, user.id),
    fetchProfileTickets(supabase, user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ProfileHeader
        userId={user.id}
        email={user.email ?? ""}
        profile={profile}
      />

      <MyEventsSection
        upcoming={ticketData.upcoming}
        past={ticketData.past}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <EnrollmentsSection
          enrollments={competitionData.enrollments}
          className="h-full"
        />
        <AchievementsSection
          achievements={competitionData.achievements}
          className="h-full"
        />
        <HistorySection
          history={competitionData.history}
          className="h-full"
        />
      </div>
    </div>
  );
}
