import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/avatar-upload";
import { formatDate, formatScore } from "@/lib/utils";
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
  avatarUrl,
}: {
  fullName: string;
  bio: string | null;
  danceRole: string | null;
  age: number | null;
  gender: string | null;
  avatarUrl?: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <UserAvatar name={fullName} avatarUrl={avatarUrl} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
            {danceRole && (
              <span className="capitalize">Usual role: {danceRole}</span>
            )}
            {age != null && <span>Age: {age}</span>}
            {gender && (
              <span className="capitalize">
                Gender: {gender.replace(/_/g, " ")}
              </span>
            )}
          </div>
          {bio && <p className="mt-4 text-sm text-gray-600">{bio}</p>}
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
        <p className="text-sm text-gray-500">
          You are not registered for any active competition.{" "}
          <Link href="/competitions" className="text-brand-600 hover:underline">
            Browse competitions
          </Link>
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
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
        <p className="text-sm text-gray-500">
          No completed competitions yet. Your past events will appear here.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
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
        <p className="text-sm text-gray-500">
          Compete in a round to unlock achievements here.
        </p>
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
          className="font-medium text-gray-900 hover:text-brand-700"
        >
          {competition.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
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
        <p className="mt-1 text-xs text-gray-500">
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
    podium: "bg-amber-100 text-amber-800",
    advanced: "bg-green-100 text-green-800",
    participated: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[achievement.kind]}`}
      >
        {achievement.kind === "podium"
          ? "Podium"
          : achievement.kind === "advanced"
            ? "Advanced"
            : "Result"}
      </span>
      <p className="mt-2 font-medium text-gray-900">{achievement.label}</p>
      <p className="text-sm text-gray-500">{achievement.competitionName}</p>
      <p className="mt-2 text-xs text-gray-500">
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
