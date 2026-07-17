"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Competition, CompetitionStatus } from "@/types/database";

export function CompetitionSettings({
  competition,
}: {
  competition: Competition;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<CompetitionStatus>(competition.status);
  const [registrationOpen, setRegistrationOpen] = useState(
    competition.registration_open
  );
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("competitions")
      .update({ status, registration_open: registrationOpen })
      .eq("id", competition.id);
    setLoading(false);
    router.refresh();
  }

  return (
    <Card title="Settings">
      <div className="flex flex-wrap items-end gap-4">
        <Select
          label="Status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as CompetitionStatus)
          }
          options={[
            { value: "draft", label: "Draft" },
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
            { value: "in_progress", label: "In Progress" },
            { value: "completed", label: "Completed" },
          ]}
        />
        <label className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            checked={registrationOpen}
            onChange={(e) => setRegistrationOpen(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Registration open</span>
        </label>
        <Button onClick={handleSave} disabled={loading} size="sm">
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </Card>
  );
}
