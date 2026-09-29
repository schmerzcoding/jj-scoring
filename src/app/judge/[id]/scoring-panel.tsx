"use client";

import { useMemo, useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  isPlacementFormat,
  normalizeScoringFormat,
  placementOrdinal,
} from "@/lib/scoring-formats";
import type { ParticipantRow } from "@/lib/leaderboard";
import type { RegistrationRole, RoundScoringFormat } from "@/types/database";

type Participant = ParticipantRow;

type ExistingJudgeScore = {
  score: number;
  advanceVote: boolean | null;
};

function groupByRole(participants: Participant[]) {
  return {
    leaders: participants.filter((p) => p.role === "leader"),
    followers: participants.filter((p) => p.role === "follower"),
  };
}

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
  const normalizedFormat = normalizeScoringFormat(scoringFormat);
  const isVoteFormat = normalizedFormat === "vote_coefficient";
  const isPlacement = isPlacementFormat(normalizedFormat);
  const isCrossed = normalizedFormat === "crossed_placement";

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

  const roleGroups = useMemo(() => {
    if (isCrossed) return groupByRole(participants);
    return { leaders: [], followers: [] };
  }, [isCrossed, participants]);

  function placementOptionsForRole(role: RegistrationRole) {
    const count = participants.filter((p) => p.role === role).length;
    return Array.from({ length: count }, (_, index) => {
      const value = index + 1;
      return { value: String(value), label: placementOrdinal(value) };
    });
  }

  function duplicatePlacementInRole(
    registrationId: string,
    role: RegistrationRole,
    value: string
  ): boolean {
    if (!value) return false;
    return participants.some(
      (p) =>
        p.role === role &&
        p.id !== registrationId &&
        scores[p.id] === value
    );
  }

  function isValidScore(registrationId: string, role: RegistrationRole): boolean {
    const scoreValue = parseFloat(scores[registrationId]);
    if (isNaN(scoreValue)) return false;

    if (isVoteFormat) {
      return scoreValue >= 1 && scoreValue <= 10;
    }

    if (isPlacement) {
      const max = participants.filter((p) => p.role === role).length;
      if (scoreValue < 1 || scoreValue > max || !Number.isInteger(scoreValue)) {
        return false;
      }
      return !duplicatePlacementInRole(registrationId, role, scores[registrationId]);
    }

    return scoreValue >= 0 && scoreValue <= 10;
  }

  function canSave(registrationId: string, role: RegistrationRole): boolean {
    if (!isValidScore(registrationId, role)) return false;
    if (isVoteFormat && votes[registrationId] == null) return false;
    return true;
  }

  async function saveScore(registrationId: string, role: RegistrationRole) {
    if (!canSave(registrationId, role)) return;

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
      if (canSave(p.id, p.role)) {
        await saveScore(p.id, p.role);
      }
    }
  }

  const description = isVoteFormat
    ? `${participants.length} participants — vote Yes/No to advance and assign a coefficient (1–10) for tiebreakers`
    : isCrossed
      ? `${participants.length} participants — assign a unique placement (1st, 2nd, …) within each role`
      : isPlacement
        ? `${participants.length} participants — assign a unique placement (1st, 2nd, …) for each competitor`
        : `${participants.length} participants — score from 0 to 10`;

  function renderParticipantRow(p: Participant) {
    const placementOptions = isPlacement
      ? [{ value: "", label: "Select…" }, ...placementOptionsForRole(p.role)]
      : [];

    return (
      <div
        key={p.id}
        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <span className="font-medium text-foreground">
            {p.display_name ?? p.profile?.full_name ?? "Unknown"}
          </span>
          <span className="ml-2 text-sm capitalize text-muted">({p.role})</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isVoteFormat && (
            <div className="flex rounded-xl border border-border bg-surface-raised p-0.5">
              <button
                type="button"
                onClick={() => setVotes((prev) => ({ ...prev, [p.id]: true }))}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  votes[p.id] === true
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setVotes((prev) => ({ ...prev, [p.id]: false }))}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  votes[p.id] === false
                    ? "bg-red-800 text-white shadow-sm"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
              >
                No
              </button>
            </div>
          )}
          {isPlacement ? (
            <select
              value={scores[p.id] ?? ""}
              onChange={(e) =>
                setScores((prev) => ({ ...prev, [p.id]: e.target.value }))
              }
              className="min-w-28 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-foreground shadow-inner shadow-black/10 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
            >
              {placementOptions.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              min={isVoteFormat ? "1" : "0"}
              max="10"
              step={isVoteFormat ? "1" : "0.5"}
              value={scores[p.id] ?? ""}
              onChange={(e) =>
                setScores((prev) => ({ ...prev, [p.id]: e.target.value }))
              }
              className="w-24 rounded-xl border border-border bg-surface-raised px-3 py-2 text-center text-sm text-foreground shadow-inner shadow-black/10 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
              placeholder={isVoteFormat ? "Coef 1-10" : "0-10"}
            />
          )}
          <Button
            size="sm"
            variant={saved[p.id] ? "success" : "primary"}
            onClick={() => saveScore(p.id, p.role)}
            loading={saving === p.id}
            disabled={!canSave(p.id, p.role) && saving !== p.id}
          >
            {saved[p.id] ? "Saved!" : "Save"}
          </Button>
        </div>
        {isPlacement &&
          scores[p.id] &&
          duplicatePlacementInRole(p.id, p.role, scores[p.id]) && (
            <p className="text-xs text-red-400 sm:basis-full sm:text-right">
              Each placement can only be used once per role.
            </p>
          )}
      </div>
    );
  }

  function renderRoleSection(label: string, group: Participant[]) {
    if (group.length === 0) return null;
    return (
      <div>
        <h4 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </h4>
        <div className="divide-y divide-border">{group.map(renderParticipantRow)}</div>
      </div>
    );
  }

  return (
    <Card title={`Scoring: ${roundName}`} description={description}>
      {participants.length === 0 ? (
        <EmptyState
          icon="users"
          title="No participants"
          description="There are no approved participants eligible for this round."
          compact
        />
      ) : (
        <>
          {isCrossed ? (
            <div className="space-y-6">
              {renderRoleSection("Leaders", roleGroups.leaders)}
              {renderRoleSection("Followers", roleGroups.followers)}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {participants.map(renderParticipantRow)}
            </div>
          )}
          <div className="mt-4 border-t border-border pt-4">
            <Button onClick={saveAll}>
              {isPlacement ? "Save All Placements" : "Save All Scores"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
