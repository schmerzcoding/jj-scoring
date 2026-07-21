import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { EventTypeBadge } from "@/components/event-type-badge";
import { formatDate } from "@/lib/utils";
import { isCompetitionEvent } from "@/lib/events";
import { isOrganizerRole } from "@/lib/permissions";
import { RegistrationsPanel } from "@/app/admin/competitions/[id]/registrations-panel";
import { RoundsPanel } from "@/app/admin/competitions/[id]/rounds-panel";
import { JudgesPanel } from "@/app/admin/competitions/[id]/judges-panel";
import { CompetitionSettings } from "@/app/admin/competitions/[id]/competition-settings";
import { CompetitionBranding } from "@/app/admin/competitions/[id]/competition-branding";

export default async function OrganizerEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || (!isOrganizerRole(profile.role) && profile.role !== "admin")) {
    redirect("/");
  }

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();
  if (!competition) notFound();

  if (profile.role === "organizer" && competition.created_by !== user.id) {
    redirect("/organizer");
  }

  const isCompetition = isCompetitionEvent(competition.event_type);

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("competition_id", id)
    .order("created_at", { ascending: false });

  const userIds = [...new Set(registrations?.map((r) => r.user_id) ?? [])];
  const { data: registrationProfiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string }[] };

  const profileById = new Map(
    registrationProfiles?.map((p) => [p.id, p]) ?? []
  );
  const registrationsWithProfiles =
    registrations?.map((registration) => ({
      ...registration,
      profile: profileById.get(registration.user_id) ?? null,
    })) ?? [];

  const { data: rounds } = isCompetition
    ? await supabase
        .from("rounds")
        .select("*")
        .eq("competition_id", id)
        .order("order_index")
    : { data: [] };

  const { data: judges } = isCompetition
    ? await supabase
        .from("competition_judges")
        .select("*")
        .eq("competition_id", id)
    : { data: [] };

  const judgeIds = [...new Set(judges?.map((j) => j.judge_id) ?? [])];
  const { data: judgeProfiles } =
    judgeIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", judgeIds)
      : { data: [] as { id: string; full_name: string }[] };

  const judgeProfileById = new Map(judgeProfiles?.map((p) => [p.id, p]) ?? []);
  const judgesWithProfiles =
    judges?.map((assignment) => ({
      ...assignment,
      profile: judgeProfileById.get(assignment.judge_id) ?? null,
    })) ?? [];

  const approvedParticipants =
    registrationsWithProfiles
      .filter((registration) => registration.status === "approved")
      .map(({ id, role, display_name, profile }) => ({
        id,
        role,
        display_name,
        profile,
      })) ?? [];

  const { data: allJudges } = isCompetition
    ? await supabase.from("profiles").select("*").eq("role", "judge")
    : { data: [] };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/organizer"
          className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
        >
          &larr; Back to dashboard
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">{competition.name}</h1>
              <EventTypeBadge type={competition.event_type} />
            </div>
            <div className="mt-2 flex gap-4 text-sm text-muted">
              {competition.location && <span>{competition.location}</span>}
              <span>{formatDate(competition.event_date)}</span>
            </div>
          </div>
          <StatusBadge status={competition.status} />
        </div>
      </div>

      {competition.status === "draft" && (
        <div className="rounded-xl border border-amber-800/50 bg-amber-950/40 p-4">
          <p className="text-sm text-amber-200">
            This event is in <strong className="text-amber-100">draft</strong> and is hidden from
            the public list. Change status to <strong className="text-amber-100">Open</strong> below
            and enable registration when you are ready.
          </p>
        </div>
      )}

      <CompetitionSettings competition={competition} />
      <CompetitionBranding competition={competition} />

      {!isCompetition && (
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <p className="text-sm text-muted">
            Registration, rounds, and judging are available for competition events. Type-specific
            setup for {competition.event_type} events will be added soon.
          </p>
        </div>
      )}

      {isCompetition && (
        <>
          <RegistrationsPanel registrations={registrationsWithProfiles} />
          <RoundsPanel
            competitionId={id}
            rounds={rounds ?? []}
            participants={approvedParticipants}
          />
          <JudgesPanel
            competitionId={id}
            assignedJudges={judgesWithProfiles}
            availableJudges={allJudges ?? []}
          />
        </>
      )}
    </div>
  );
}
