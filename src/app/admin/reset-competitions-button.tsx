"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CONFIRM_TEXT = "DELETE ALL";

export function ResetCompetitionsButton({
  competitionCount,
}: {
  competitionCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirmValue !== CONFIRM_TEXT) {
      setError(`Type ${CONFIRM_TEXT} to confirm.`);
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: competitions, error: fetchError } = await supabase
      .from("competitions")
      .select("id");

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const ids = competitions?.map((competition) => competition.id) ?? [];

    if (ids.length === 0) {
      setOpen(false);
      setConfirmValue("");
      setLoading(false);
      router.refresh();
      return;
    }

    const { error: deleteError } = await fromTable(supabase, "competitions")
      .delete()
      .in("id", ids);

    setLoading(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setOpen(false);
    setConfirmValue("");
    router.refresh();
  }

  return (
    <Card
      title="Danger zone"
      description="Remove all competitions and related data (rounds, registrations, scores, standings). User accounts are kept."
    >
      {!open ? (
        <Button
          type="button"
          variant="secondary"
          className="border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => setOpen(true)}
          disabled={competitionCount === 0}
        >
          {competitionCount === 0
            ? "No competitions to delete"
            : `Delete all ${competitionCount} competition${competitionCount === 1 ? "" : "s"}`}
        </Button>
      ) : (
        <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            This permanently deletes{" "}
            <strong>
              {competitionCount} competition{competitionCount === 1 ? "" : "s"}
            </strong>{" "}
            and all rounds, registrations, scores, and standings. This cannot
            be undone.
          </p>
          <Input
            label={`Type ${CONFIRM_TEXT} to confirm`}
            value={confirmValue}
            onChange={(e) => {
              setConfirmValue(e.target.value);
              setError("");
            }}
            placeholder={CONFIRM_TEXT}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={loading || confirmValue !== CONFIRM_TEXT}
            >
              {loading ? "Deleting..." : "Delete everything"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setConfirmValue("");
                setError("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
