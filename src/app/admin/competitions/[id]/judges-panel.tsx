"use client";

import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Profile, CompetitionJudgeWithProfile } from "@/types/database";

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

  async function assignJudge(judgeId: string) {
    const supabase = createClient();
    await fromTable(supabase, "competition_judges").insert({
      competition_id: competitionId,
      judge_id: judgeId,
    });
    router.refresh();
  }

  async function removeJudge(assignmentId: string) {
    const supabase = createClient();
    await fromTable(supabase, "competition_judges").delete().eq("id", assignmentId);
    router.refresh();
  }

  return (
    <Card title="Judges" description="Assign judges to this competition">
      {assignedJudges.length > 0 && (
        <div className="mb-4 divide-y divide-border">
          {assignedJudges.map((j) => (
            <div
              key={j.id}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm font-medium text-foreground">
                {j.profile?.full_name ?? "Unknown"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeJudge(j.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {unassigned.length > 0 ? (
        <div className="flex items-end gap-3">
          <Select
            label="Add judge"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) assignJudge(e.target.value);
            }}
            options={[
              { value: "", label: "Select a judge..." },
              ...unassigned.map((j) => ({
                value: j.id,
                label: j.full_name,
              })),
            ]}
          />
        </div>
      ) : (
        <p className="text-sm text-muted">
          {availableJudges.length === 0
            ? "No judge accounts exist. Create judge users in Supabase and set their role to 'judge'."
            : "All available judges are assigned."}
        </p>
      )}
    </Card>
  );
}
