import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { getCountryName } from "@/lib/countries";
import { RegistrationForm } from "./registration-form";
import { Leaderboard } from "@/components/leaderboard";
import { getPublishedRoundLeaderboards } from "@/lib/leaderboard-server";
import type { ParticipantRow } from "@/lib/leaderboard";

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();

  if (!competition) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingRegistration = null;
  if (user) {
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .eq("competition_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    existingRegistration = data;
  }

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("order_index");

  const { data: approvedRegistrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("competition_id", id)
    .eq("status", "approved");

  const userIds = [...new Set(approvedRegistrations?.map((r) => r.user_id) ?? [])];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string }[] };

  const profileById = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  const participants: ParticipantRow[] =
    approvedRegistrations?.map((registration) => ({
      id: registration.id,
      role: registration.role,
      display_name: registration.display_name,
      profile: profileById.get(registration.user_id) ?? null,
    })) ?? [];

  const publishedLeaderboards = await getPublishedRoundLeaderboards(
    supabase,
    id,
    rounds ?? [],
    participants
  );

  const hasPublishedRounds = (rounds ?? []).some(
    (round) => round.leaderboard_published
  );
  const hasCompletedRounds = (rounds ?? []).some(
    (round) => round.status === "completed"
  );

  return (
    <div className="space-y-8">
      {competition.banner_url && (
        <div className="overflow-hidden rounded-2xl border border-border shadow-lg shadow-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={competition.banner_url}
            alt=""
            className="aspect-[3/1] w-full object-cover"
          />
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {competition.name}
            </h1>
            {competition.description && (
              <p className="mt-2 text-muted">{competition.description}</p>
            )}
          </div>
          <StatusBadge status={competition.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {competition.country_code && (
            <span>{getCountryName(competition.country_code)}</span>
          )}
          {competition.location && <span>{competition.location}</span>}
          <span>{formatDate(competition.event_date)}</span>
        </div>
      </div>

      {competition.registration_open && user && !existingRegistration && (
        <RegistrationForm competitionId={id} />
      )}

      {existingRegistration && (
        <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
          <h2 className="font-semibold text-foreground">Your Registration</h2>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-sm capitalize text-muted">
              Role: {existingRegistration.role}
            </span>
            <StatusBadge status={existingRegistration.status} />
          </div>
          {existingRegistration.status === "pending" && (
            <p className="mt-2 text-sm text-muted">
              Your registration is pending admin approval.
            </p>
          )}
        </div>
      )}

      {rounds && rounds.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground">Rounds</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rounds.map((round) => (
              <div
                key={round.id}
                className="rounded-xl border border-border bg-surface-overlay p-4 transition-colors hover:border-brand-800/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{round.name}</span>
                  <StatusBadge status={round.status} />
                </div>
                <p className="mt-1 text-xs capitalize text-muted">
                  {round.role_type}
                </p>
                {round.leaderboard_published && (
                  <p className="mt-2 text-xs font-medium text-emerald-400">
                    Results published
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(hasPublishedRounds || hasCompletedRounds || publishedLeaderboards.length > 0) && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Results</h2>
          {publishedLeaderboards.length === 0 ? (
            <p className="text-sm text-muted">
              {hasCompletedRounds
                ? "Results are being finalized. Check back soon."
                : "Results will appear here once rounds are completed."}
            </p>
          ) : (
            publishedLeaderboards.map(({ round, entries }) => (
              <Leaderboard
                key={round.id}
                title={round.name}
                entries={entries}
                showAdvanced={false}
                scoringFormat={round.scoring_format ?? "numeric"}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
