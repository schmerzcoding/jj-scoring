import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/avatar-upload";
import { formatDate, formatScore } from "@/lib/utils";
import { getCountryName } from "@/lib/countries";
import type {
  Achievement,
  RegistrationWithCompetition,
} from "@/lib/profile-stats";
import { registrationStatusLabel } from "@/lib/profile-stats";

export function ProfileSummary({
  fullName,
  bio,
  danceRole,
  age,
  gender,
  countryCode,
  avatarUrl,
}: {
  fullName: string;
  bio: string | null;
  danceRole: string | null;
  age: number | null;
  gender: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <UserAvatar name={fullName} avatarUrl={avatarUrl} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
            {danceRole && (
              <span className="capitalize">Usual role: {danceRole}</span>
            )}
            {age != null && <span>Age: {age}</span>}
            {gender && (
              <span className="capitalize">
                Gender: {gender.replace(/_/g, " ")}
              </span>
            )}
            {countryCode && <span>{getCountryName(countryCode)}</span>}
          </div>
          {bio && <p className="mt-4 text-sm text-muted">{bio}</p>}
        </div>
      </div>
    </div>
  );
}

export function EnrollmentsSection({
  enrollments,
}: {
  enrollments: RegistrationWithCompetition[];
}) {
  return (
    <Card
      title="Current registrations"
      description="Competitions you are signed up for"
    >
      {enrollments.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No active registrations"
          description="Browse open competitions and sign up as leader or follower."
          compact
          action={
            <Link href="/competitions">
              <Button size="sm">Browse competitions</Button>
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {enrollments.map((registration) => (
            <RegistrationRow key={registration.id} registration={registration} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function HistorySection({
  history,
}: {
  history: RegistrationWithCompetition[];
}) {
  return (
    <Card
      title="Competition history"
      description="Events you have completed"
    >
      {history.length === 0 ? (
        <EmptyState
          icon="clipboard"
          title="No history yet"
          description="Completed competitions you took part in will show up here."
          compact
        />
      ) : (
        <div className="divide-y divide-border">
          {history.map((registration) => (
            <RegistrationRow key={registration.id} registration={registration} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function AchievementsSection({
  achievements,
}: {
  achievements: Achievement[];
}) {
  return (
    <Card
      title="Achievements"
      description="Results and milestones from your rounds"
    >
      {achievements.length === 0 ? (
        <EmptyState
          icon="trophy"
          title="No achievements yet"
          description="Compete in a round to unlock your first milestone."
          compact
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </Card>
  );
}

function RegistrationRow({
  registration,
}: {
  registration: RegistrationWithCompetition;
}) {
  const { competition } = registration;

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link
          href={`/competitions/${competition.id}`}
          className="font-medium text-foreground transition-colors hover:text-brand-400"
        >
          {competition.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="capitalize">{registration.role}</span>
          <span>·</span>
          <span>{formatDate(competition.event_date)}</span>
          {competition.location && (
            <>
              <span>·</span>
              <span>{competition.location}</span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Registration: {registrationStatusLabel(registration.status)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={registration.status} />
        <StatusBadge status={competition.status} />
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const badgeStyles = {
    podium: "bg-amber-950/60 text-amber-300 ring-1 ring-amber-800/50",
    advanced: "bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-800/50",
    participated: "bg-surface-hover text-muted-foreground ring-1 ring-border",
  };

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4 transition-colors hover:border-brand-800/30">
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[achievement.kind]}`}
      >
        {achievement.kind === "podium"
          ? "Podium"
          : achievement.kind === "advanced"
            ? "Advanced"
            : "Result"}
      </span>
      <p className="mt-2 font-medium text-foreground">{achievement.label}</p>
      <p className="text-sm text-muted">{achievement.competitionName}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {achievement.scoringFormat === "vote_coefficient" ? (
          <>
            {achievement.yesVotes} Yes · coef{" "}
            {formatScore(achievement.coefficientTotal)}
          </>
        ) : (
          <>
            Rank #{achievement.rankInRole} · {formatScore(achievement.totalScore)}{" "}
            pts
          </>
        )}
      </p>
    </div>
  );
}
