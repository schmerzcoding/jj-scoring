"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, fromTable } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketTypesEditor } from "@/components/ticket-types-editor";
import {
  createEmptyTicketTypeDraft,
  defaultPassTypeForEvent,
  type TicketTypeDraft,
} from "@/lib/ticket-types";
import { formatCentsToEuroInput, parseEuroInputToCents } from "@/lib/ticket-pricing";
import type { EventType, TicketType } from "@/types/database";

function toDraft(type: TicketType): TicketTypeDraft {
  return {
    key: type.id,
    name: type.name,
    description: type.description ?? "",
    priceEuro: formatCentsToEuroInput(type.price_cents),
    passType: type.pass_type,
  };
}

export function TicketTypesPanel({
  competitionId,
  eventType,
  initialTypes,
}: {
  competitionId: string;
  eventType: EventType;
  initialTypes: TicketType[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<TicketTypeDraft[]>(
    initialTypes.length > 0
      ? initialTypes.map(toDraft)
      : [createEmptyTicketTypeDraft(defaultPassTypeForEvent(eventType))]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const validDrafts = drafts
      .map((draft, index) => {
        const priceCents = parseEuroInputToCents(draft.priceEuro);
        if (!draft.name.trim() || priceCents == null || priceCents < 0) {
          return null;
        }
        return {
          id: initialTypes.some((type) => type.id === draft.key) ? draft.key : undefined,
          competition_id: competitionId,
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          price_cents: priceCents,
          pass_type: draft.passType,
          sort_order: index,
          is_active: priceCents > 0,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (validDrafts.length === 0) {
      setError("Add at least one pass with a name and price.");
      setLoading(false);
      return;
    }

    const existingIds = new Set(initialTypes.map((type) => type.id));
    const draftIds = new Set(
      validDrafts.map((draft) => draft.id).filter(Boolean) as string[]
    );
    const removedIds = [...existingIds].filter((id) => !draftIds.has(id));

    for (const id of removedIds) {
      const { error: deactivateError } = await fromTable(supabase, "ticket_types")
        .update({ is_active: false })
        .eq("id", id);
      if (deactivateError) {
        setError(deactivateError.message);
        setLoading(false);
        return;
      }
    }

    for (const draft of validDrafts) {
      if (draft.id) {
        const { error: updateError } = await fromTable(supabase, "ticket_types")
          .update({
            name: draft.name,
            description: draft.description,
            price_cents: draft.price_cents,
            pass_type: draft.pass_type,
            sort_order: draft.sort_order,
            is_active: draft.is_active,
          })
          .eq("id", draft.id);
        if (updateError) {
          setError(updateError.message);
          setLoading(false);
          return;
        }
      } else {
        const { error: insertError } = await fromTable(supabase, "ticket_types").insert({
          competition_id: draft.competition_id,
          name: draft.name,
          description: draft.description,
          price_cents: draft.price_cents,
          pass_type: draft.pass_type,
          sort_order: draft.sort_order,
          is_active: draft.is_active,
        });
        if (insertError) {
          setError(insertError.message);
          setLoading(false);
          return;
        }
      }
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <Card
      title="Ticket passes"
      description="Create different pass types for this event (day passes, social passes, workshop passes, etc.)."
    >
      <TicketTypesEditor
        drafts={drafts}
        onChange={setDrafts}
        defaultPassType={defaultPassTypeForEvent(eventType)}
      />
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <div className="mt-4">
        <Button onClick={() => void handleSave()} loading={loading} size="sm">
          {loading ? "Saving..." : "Save passes"}
        </Button>
      </div>
    </Card>
  );
}
