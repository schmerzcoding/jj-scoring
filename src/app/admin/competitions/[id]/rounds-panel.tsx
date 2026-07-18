"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Leaderboard } from "@/components/leaderboard";
import { completeRound, fetchLeaderboardForRound } from "@/lib/round-actions";
import type { LeaderboardEntry, ParticipantRow } from "@/lib/leaderboard";
import type { Round } from "@/types/database";

export function RoundsPanel({
  competitionId,
  rounds,
  participants,
}: {
  competitionId: string;
  rounds: Round[];
  participants: ParticipantRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState<"leader" | "follower" | "both">("both");
  const [loading, setLoading] = useState(false);
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [loadingBoard, setLoadingBoard] = useState<string | null>(null);

  async function addRound(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const supabase = createClient();
    await fromTable(supabase, "rounds").insert({
      competition_id: competitionId,
      name: name.trim(),
      order_index: rounds.length,
      role_type: roleType,
      status: "pending",
      leaderboard_published: false,
    });

    setName("");
    setLoading(false);
    router.refresh();
  }

  async function setRoundStatus(roundId: string, status: Round["status"]) {
    const supabase = createClient();

    if (status === "active") {
      await fromTable(supabase, "rounds")
        .update({ status: "pending" })
        .eq("competition_id", competitionId)
        .eq("status", "active");
    }

    await fromTable(supabase, "rounds").update({ status }).eq("id", roundId);
    router.refresh();
  }

  async function saveAdvanceSettings(
    round: Round,
    maxLeaders: string,
    maxFollowers: string
  ) {
    const supabase = createClient();
    await fromTable(supabase, "rounds")
      .update({
        max_advance_leaders: maxLeaders ? parseInt(maxLeaders, 10) : null,
        max_advance_followers: maxFollowers ? parseInt(maxFollowers, 10) : null,
      })
      .eq("id", round.id);
    router.refresh();
  }

  async function togglePublish(round: Round, published: boolean) {
    const supabase = createClient();
    await fromTable(supabase, "rounds")
      .update({ leaderboard_published: published })
      .eq("id", round.id);
    router.refresh();
  }

  async function handleCompleteRound(round: Round) {
    setLoading(true);
    const result = await completeRound(round, rounds, participants);
    setLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    router.refresh();
  }

  async function loadLeaderboard(round: Round) {
    setLoadingBoard(round.id);
    const supabase = createClient();
    const entries = await fetchLeaderboardForRound(
      supabase,
      round,
      rounds,
      participants
    );
    setLeaderboards((prev) => ({ ...prev, [round.id]: entries }));
    setLoadingBoard(null);
  }

  return (
    <Card title="Rounds" description="Manage phases, advancement, and leaderboards">
      {rounds.length > 0 && (
        <div className="mb-6 space-y-6">
          {rounds.map((round) => (
            <RoundRow
              key={round.id}
              round={round}
              entries={leaderboards[round.id]}
              loadingBoard={loadingBoard === round.id}
              onActivate={() => setRoundStatus(round.id, "active")}
              onComplete={() => handleCompleteRound(round)}
              onSaveAdvance={saveAdvanceSettings}
              onTogglePublish={togglePublish}
              onLoadLeaderboard={() => loadLeaderboard(round)}
              busy={loading}
            />
          ))}
        </div>
      )}

      <form onSubmit={addRound} className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
        <Input
          label="Round name"
          placeholder="e.g. Play-in, Phase 1, Semifinal, Final"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select
          label="Role type"
          value={roleType}
          onChange={(e) =>
            setRoleType(e.target.value as "leader" | "follower" | "both")
          }
          options={[
            { value: "both", label: "Both" },
            { value: "leader", label: "Leaders only" },
            { value: "follower", label: "Followers only" },
          ]}
        />
        <Button type="submit" size="sm" disabled={loading}>
          Add Round
        </Button>
      </form>
    </Card>
  );
}

function RoundRow({
  round,
  entries,
  loadingBoard,
  onActivate,
  onComplete,
  onSaveAdvance,
  onTogglePublish,
  onLoadLeaderboard,
  busy,
}: {
  round: Round;
  entries?: LeaderboardEntry[];
  loadingBoard: boolean;
  onActivate: () => void;
  onComplete: () => void;
  onSaveAdvance: (round: Round, leaders: string, followers: string) => void;
  onTogglePublish: (round: Round, published: boolean) => void;
  onLoadLeaderboard: () => void;
  busy: boolean;
}) {
  const [maxLeaders, setMaxLeaders] = useState(
    round.max_advance_leaders?.toString() ?? ""
  );
  const [maxFollowers, setMaxFollowers] = useState(
    round.max_advance_followers?.toString() ?? ""
  );

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-medium text-gray-900">{round.name}</span>
          <span className="ml-2 text-sm capitalize text-gray-500">
            ({round.role_type})
          </span>
          {round.leaderboard_published && (
            <span className="ml-2 text-xs font-medium text-green-600">
              Leaderboard published
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={round.status} />
          {round.status === "pending" && (
            <Button size="sm" onClick={onActivate}>
              Activate
            </Button>
          )}
          {round.status === "active" && (
            <Button size="sm" variant="secondary" onClick={onComplete} disabled={busy}>
              Complete & calculate advancement
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Input
          label="Leaders advancing"
          type="number"
          min="0"
          placeholder="e.g. 30"
          value={maxLeaders}
          onChange={(e) => setMaxLeaders(e.target.value)}
          className="w-36"
        />
        <Input
          label="Followers advancing"
          type="number"
          min="0"
          placeholder="e.g. 30"
          value={maxFollowers}
          onChange={(e) => setMaxFollowers(e.target.value)}
          className="w-36"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSaveAdvance(round, maxLeaders, maxFollowers)}
        >
          Save advancement
        </Button>
        <Button size="sm" variant="ghost" onClick={onLoadLeaderboard} disabled={loadingBoard}>
          {loadingBoard ? "Loading..." : "Show leaderboard"}
        </Button>
        {round.status === "completed" && (
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={round.leaderboard_published}
              onChange={(e) => onTogglePublish(round, e.target.checked)}
              className="rounded border-gray-300"
            />
            Publish leaderboard publicly
          </label>
        )}
      </div>

      {entries && (
        <div className="mt-4">
          <Leaderboard
            title={`${round.name} — Leaderboard`}
            entries={entries}
            showAdvanced={round.status === "completed"}
          />
        </div>
      )}
    </div>
  );
}
