"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import type { Round } from "@/types/database";

export function RoundsPanel({
  competitionId,
  rounds,
}: {
  competitionId: string;
  rounds: Round[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState<"leader" | "follower" | "both">("both");
  const [loading, setLoading] = useState(false);

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

  return (
    <Card title="Rounds" description="Manage competition phases">
      {rounds.length > 0 && (
        <div className="mb-6 divide-y divide-gray-100">
          {rounds.map((round) => (
            <div
              key={round.id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <span className="font-medium text-gray-900">{round.name}</span>
                <span className="ml-2 text-sm capitalize text-gray-500">
                  ({round.role_type})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={round.status} />
                {round.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => setRoundStatus(round.id, "active")}
                  >
                    Activate
                  </Button>
                )}
                {round.status === "active" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRoundStatus(round.id, "completed")}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addRound} className="flex flex-wrap items-end gap-3">
        <Input
          label="Round name"
          placeholder="e.g. Phase 1, Semifinal, Final"
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
