"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Profile, CompetitionJudgeWithProfile, RegistrationRole } from "@/types/database";

export function JudgesPanel({
  competitionId,
  assignedJudges,
  availableJudges,
}: {
  competitionId: string;
  assignedJudges: CompetitionJudgeWithProfile[];
  availableJudges: Profile[];
}) {
  const router = useRouter();
  const assignedIds = new Set(assignedJudges.map((j) => j.judge_id));
  const unassigned = availableJudges.filter((j) => !assignedIds.has(j.id));
  const [selectedJudgeId, setSelectedJudgeId] = useState("");
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>("leader");
  const [assigning, setAssigning] = useState(false);

  async function assignJudge(judgeId: string, judgeRole: RegistrationRole) {
    if (!judgeId) return;
    setAssigning(true);
    const supabase = createClient();
    await fromTable(supabase, "competition_judges").insert({
      competition_id: competitionId,
      judge_id: judgeId,
      judge_role: judgeRole,
    });
    setSelectedJudgeId("");
    setAssigning(false);
    router.refresh();
  }

  async function updateJudgeRole(assignmentId: string, judgeRole: RegistrationRole) {
    const supabase = createClient();
    await fromTable(supabase, "competition_judges")
      .update({ judge_role: judgeRole })
      .eq("id", assignmentId);
    router.refresh();
  }

  async function removeJudge(assignmentId: string) {
    const supabase = createClient();
    await fromTable(supabase, "competition_judges").delete().eq("id", assignmentId);
    router.refresh();
  }

  return (
    <Card
      title="Judges"
      description="Assign judges and choose whether they score leaders or followers"
    >
      {assignedJudges.length > 0 && (
        <div className="mb-4 divide-y divide-border">
          {assignedJudges.map((j) => (
            <div
              key={j.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm font-medium text-foreground">
                {j.profile?.full_name ?? "Unknown"}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  label="Scores"
                  value={j.judge_role ?? "leader"}
                  onChange={(e) =>
                    updateJudgeRole(j.id, e.target.value as RegistrationRole)
                  }
                  options={[
                    { value: "leader", label: "Leaders" },
                    { value: "follower", label: "Followers" },
                  ]}
                  className="w-36"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeJudge(j.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {unassigned.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Add judge"
            value={selectedJudgeId}
            onChange={(e) => setSelectedJudgeId(e.target.value)}
            options={[
              { value: "", label: "Select a judge..." },
              ...unassigned.map((j) => ({
                value: j.id,
                label: j.full_name,
              })),
            ]}
            className="min-w-48"
          />
          <Select
            label="Scores role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as RegistrationRole)}
            options={[
              { value: "leader", label: "Leaders" },
              { value: "follower", label: "Followers" },
            ]}
            className="w-36"
          />
          <Button
            size="sm"
            disabled={!selectedJudgeId || assigning}
            loading={assigning}
            onClick={() => assignJudge(selectedJudgeId, selectedRole)}
          >
            Assign
          </Button>
        </div>
      ) : (
        <EmptyState
          icon="gavel"
          title={
            availableJudges.length === 0
              ? "No judge accounts"
              : "All judges assigned"
          }
          description={
            availableJudges.length === 0
              ? "Create judge users in Supabase and set their role to 'judge'."
              : "Every available judge is already on this competition."
          }
          compact
        />
      )}
    </Card>
  );
}
