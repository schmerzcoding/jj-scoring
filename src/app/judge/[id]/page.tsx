import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { ScoringPanel } from "./scoring-panel";

export default async function JudgeCompetitionPage({
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

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();
  if (!competition) notFound();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("order_index");

  const activeRound = rounds?.find((r) => r.status === "active");

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*, profile:profiles(*)")
    .eq("competition_id", id)
    .eq("status", "approved");

  const filteredRegistrations = activeRound
    ? registrations?.filter((r) => {
        if (activeRound.role_type === "both") return true;
        return r.role === activeRound.role_type;
      })
    : [];

  let existingScores: Record<string, number> = {};
  if (activeRound) {
    const { data: scores } = await supabase
      .from("scores")
      .select("registration_id, score")
      .eq("round_id", activeRound.id)
      .eq("judge_id", user.id);

    if (scores) {
      existingScores = Object.fromEntries(
        scores.map((s) => [s.registration_id, Number(s.score)])
      );
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/judge" className="text-sm text-brand-600 hover:underline">
          &larr; Back to judge panel
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          {competition.name}
        </h1>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Rounds</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {rounds?.map((round) => (
            <div
              key={round.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2"
            >
              <span className="text-sm font-medium">{round.name}</span>
              <StatusBadge status={round.status} />
            </div>
          ))}
        </div>
      </div>

      {activeRound ? (
        <ScoringPanel
          roundId={activeRound.id}
          roundName={activeRound.name}
          judgeId={user.id}
          participants={filteredRegistrations ?? []}
          existingScores={existingScores}
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            No active round. Wait for the admin to activate a round.
          </p>
        </div>
      )}
    </div>
  );
}
