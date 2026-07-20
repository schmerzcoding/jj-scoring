import { formatScore } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import type { RoundScoringFormat } from "@/types/database";

interface LeaderboardProps {
  title: string;
  entries: LeaderboardEntry[];
  showAdvanced?: boolean;
  emptyMessage?: string;
  scoringFormat?: RoundScoringFormat;
}

export function Leaderboard({
  title,
  entries,
  showAdvanced = true,
  emptyMessage = "No scores yet for this round.",
  scoringFormat,
}: LeaderboardProps) {
  const leaders = entries.filter((e) => e.role === "leader");
  const followers = entries.filter((e) => e.role === "follower");
  const format = scoringFormat ?? entries[0]?.scoringFormat ?? "numeric";

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <EmptyState title={emptyMessage} compact className="mt-2" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <LeaderboardColumn
          label="Leaders"
          entries={leaders}
          showAdvanced={showAdvanced}
          scoringFormat={format}
        />
        <LeaderboardColumn
          label="Followers"
          entries={followers}
          showAdvanced={showAdvanced}
          scoringFormat={format}
        />
      </div>
    </div>
  );
}

function LeaderboardColumn({
  label,
  entries,
  showAdvanced,
  scoringFormat,
}: {
  label: string;
  entries: LeaderboardEntry[];
  showAdvanced: boolean;
  scoringFormat: RoundScoringFormat;
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </h4>
      {entries.length === 0 ? (
        <EmptyState title="No participants" compact className="py-2" />
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <div
              key={entry.registrationId}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 text-center font-medium text-muted-foreground">
                  {entry.rankInRole}
                </span>
                <span className="font-medium text-foreground">
                  {entry.displayName}
                </span>
                {showAdvanced && entry.advanced && (
                  <span className="rounded-full bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-800/50">
                    Advances
                  </span>
                )}
              </div>
              <div className="text-right text-muted">
                {scoringFormat === "vote_coefficient" ? (
                  <>
                    <div className="font-semibold text-foreground">
                      {entry.yesVotes} Yes
                    </div>
                    <div className="text-xs">
                      coef {formatScore(entry.coefficientTotal)} (
                      {entry.judgeCount} judges)
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-foreground">
                      {formatScore(entry.totalScore)} pts
                    </div>
                    <div className="text-xs">
                      avg {formatScore(entry.averageScore)} ({entry.judgeCount}{" "}
                      judges)
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
