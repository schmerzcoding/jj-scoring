import { formatScore } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/leaderboard";

interface LeaderboardProps {
  title: string;
  entries: LeaderboardEntry[];
  showAdvanced?: boolean;
  emptyMessage?: string;
}

export function Leaderboard({
  title,
  entries,
  showAdvanced = true,
  emptyMessage = "No scores yet for this round.",
}: LeaderboardProps) {
  const leaders = entries.filter((e) => e.role === "leader");
  const followers = entries.filter((e) => e.role === "follower");

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <LeaderboardColumn
          label="Leaders"
          entries={leaders}
          showAdvanced={showAdvanced}
        />
        <LeaderboardColumn
          label="Followers"
          entries={followers}
          showAdvanced={showAdvanced}
        />
      </div>
    </div>
  );
}

function LeaderboardColumn({
  label,
  entries,
  showAdvanced,
}: {
  label: string;
  entries: LeaderboardEntry[];
  showAdvanced: boolean;
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">
        {label}
      </h4>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">No participants</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <div
              key={entry.registrationId}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 text-center font-medium text-gray-400">
                  {entry.rankInRole}
                </span>
                <span className="font-medium text-gray-900">
                  {entry.displayName}
                </span>
                {showAdvanced && entry.advanced && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Advances
                  </span>
                )}
              </div>
              <div className="text-right text-gray-600">
                <div className="font-semibold text-gray-900">
                  {formatScore(entry.totalScore)} pts
                </div>
                <div className="text-xs">
                  avg {formatScore(entry.averageScore)} ({entry.judgeCount}{" "}
                  judges)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
