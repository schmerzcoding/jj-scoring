"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ParticipantRow } from "@/lib/leaderboard";
import type { RoundScoringFormat } from "@/types/database";

type Participant = ParticipantRow;

type ExistingJudgeScore = {
  score: number;
  advanceVote: boolean | null;
};

export function ScoringPanel({
  roundId,
  roundName,
  judgeId,
  participants,
  scoringFormat,
  existingScores,
}: {
  roundId: string;
  roundName: string;
  judgeId: string;
  participants: Participant[];
  scoringFormat: RoundScoringFormat;
  existingScores: Record<string, ExistingJudgeScore>;
}) {
  const isVoteFormat = scoringFormat === "vote_coefficient";

  const [scores, setScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [regId, data] of Object.entries(existingScores)) {
      initial[regId] = String(data.score);
    }
    return initial;
  });
  const [votes, setVotes] = useState<Record<string, boolean | null>>(() => {
    const initial: Record<string, boolean | null> = {};
    for (const [regId, data] of Object.entries(existingScores)) {
      initial[regId] = data.advanceVote;
    }
    return initial;
  });
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  function isValidScore(registrationId: string): boolean {
    const scoreValue = parseFloat(scores[registrationId]);
    if (isNaN(scoreValue)) return false;

    if (isVoteFormat) {
      return scoreValue >= 1 && scoreValue <= 10;
    }

    return scoreValue >= 0 && scoreValue <= 10;
  }

  function canSave(registrationId: string): boolean {
    if (!isValidScore(registrationId)) return false;
    if (isVoteFormat && votes[registrationId] == null) return false;
    return true;
  }

  async function saveScore(registrationId: string) {
    if (!canSave(registrationId)) return;

    const scoreValue = parseFloat(scores[registrationId]);
    setSaving(registrationId);
    const supabase = createClient();

    const payload = {
      score: scoreValue,
      ...(isVoteFormat ? { advance_vote: votes[registrationId] === true } : {}),
    };

    const existing = existingScores[registrationId] !== undefined;

    if (existing) {
      await fromTable(supabase, "scores")
        .update(payload)
        .eq("round_id", roundId)
        .eq("judge_id", judgeId)
        .eq("registration_id", registrationId);
    } else {
      await fromTable(supabase, "scores").insert({
        round_id: roundId,
        judge_id: judgeId,
        registration_id: registrationId,
        ...payload,
      });
    }

    setSaved((prev) => ({ ...prev, [registrationId]: true }));
    setSaving(null);
    setTimeout(() => {
      setSaved((prev) => ({ ...prev, [registrationId]: false }));
    }, 2000);
  }

  async function saveAll() {
    for (const p of participants) {
      if (canSave(p.id)) {
        await saveScore(p.id);
      }
    }
  }

  const description = isVoteFormat
    ? `${participants.length} participants — vote Yes/No to advance and assign a coefficient (1–10) for tiebreakers`
    : `${participants.length} participants — score from 0 to 10`;

  return (
    <Card title={`Scoring: ${roundName}`} description={description}>
      {participants.length === 0 ? (
        <p className="text-sm text-gray-500">
          No approved participants for this round.
        </p>
      ) : (
        <>
          <div className="divide-y divide-gray-100">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {p.display_name ?? p.profile?.full_name ?? "Unknown"}
                  </span>
                  <span className="ml-2 text-sm capitalize text-gray-500">
                    ({p.role})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isVoteFormat && (
                    <div className="flex rounded-lg border border-gray-300 p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setVotes((prev) => ({ ...prev, [p.id]: true }))
                        }
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          votes[p.id] === true
                            ? "bg-green-600 text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setVotes((prev) => ({ ...prev, [p.id]: false }))
                        }
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          votes[p.id] === false
                            ? "bg-red-600 text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  )}
                  <input
                    type="number"
                    min={isVoteFormat ? "1" : "0"}
                    max="10"
                    step={isVoteFormat ? "1" : "0.5"}
                    value={scores[p.id] ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder={isVoteFormat ? "Coef 1-10" : "0-10"}
                  />
                  <Button
                    size="sm"
                    onClick={() => saveScore(p.id)}
                    disabled={saving === p.id || !canSave(p.id)}
                  >
                    {saved[p.id]
                      ? "Saved!"
                      : saving === p.id
                        ? "..."
                        : "Save"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <Button onClick={saveAll}>Save All Scores</Button>
          </div>
        </>
      )}
    </Card>
  );
}
