"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function RegistrationForm({ competitionId }: { competitionId: string }) {
  const router = useRouter();
  const [role, setRole] = useState<"leader" | "follower">("leader");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to register.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await fromTable(supabase, "registrations").insert({
      competition_id: competitionId,
      user_id: user.id,
      role,
      status: "pending",
      display_name: displayName || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <Card title="Register for this competition">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as "leader" | "follower")}
          options={[
            { value: "leader", label: "Leader" },
            { value: "follower", label: "Follower" },
          ]}
        />
        <Input
          label="Display name (optional)"
          placeholder="How you want to appear on score sheets"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Registration"}
        </Button>
        <p className="text-xs text-gray-500">
          Your registration will be reviewed by the event organizer before approval.
        </p>
      </form>
    </Card>
  );
}
