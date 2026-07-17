"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Registration, Profile } from "@/types/database";

type Participant = Registration & { profile: Profile | null };

export function ScoringPanel({
  roundId,
  roundName,
  judgeId,
  participants,
  existingScores,
}: {
  roundId: string;
  roundName: string;
  judgeId: string;
  participants: Participant[];
  existingScores: Record<string, number>;
}) {
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [regId, score] of Object.entries(existingScores)) {
      initial[regId] = String(score);
    }
    return initial;
  });
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function saveScore(registrationId: string) {
    const scoreValue = parseFloat(scores[registrationId]);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 10) return;

    setSaving(registrationId);
    const supabase = createClient();

    const existing = existingScores[registrationId] !== undefined;

    if (existing) {
      await supabase
        .from("scores")
        .update({ score: scoreValue })
        .eq("round_id", roundId)
        .eq("judge_id", judgeId)
        .eq("registration_id", registrationId);
    } else {
      await supabase.from("scores").insert({
        round_id: roundId,
        judge_id: judgeId,
        registration_id: registrationId,
        score: scoreValue,
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
      if (scores[p.id]) {
        await saveScore(p.id);
      }
    }
  }

  return (
    <Card
      title={`Scoring: ${roundName}`}
      description={`${participants.length} participants — score from 0 to 10`}
    >
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
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {p.display_name ?? p.profile?.full_name ?? "Unknown"}
                  </span>
                  <span className="ml-2 text-sm capitalize text-gray-500">
                    ({p.role})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={scores[p.id] ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="0-10"
                  />
                  <Button
                    size="sm"
                    onClick={() => saveScore(p.id)}
                    disabled={saving === p.id || !scores[p.id]}
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
