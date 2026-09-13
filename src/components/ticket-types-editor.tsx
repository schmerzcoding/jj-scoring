"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  createEmptyTicketTypeDraft,
  PASS_TYPE_OPTIONS,
  type TicketTypeDraft,
} from "@/lib/ticket-types";
import type { TicketPassType } from "@/types/database";

export function TicketTypesEditor({
  drafts,
  onChange,
  defaultPassType = "standard",
}: {
  drafts: TicketTypeDraft[];
  onChange: (drafts: TicketTypeDraft[]) => void;
  defaultPassType?: TicketPassType;
}) {
  function updateDraft(key: string, patch: Partial<TicketTypeDraft>) {
    onChange(
      drafts.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft))
    );
  }

  function addDraft() {
    onChange([...drafts, createEmptyTicketTypeDraft(defaultPassType)]);
  }

  function removeDraft(key: string) {
    if (drafts.length <= 1) return;
    onChange(drafts.filter((draft) => draft.key !== key));
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft, index) => (
        <div
          key={draft.key}
          className="space-y-3 rounded-xl border border-border bg-surface-raised/60 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Pass {index + 1}</p>
            {drafts.length > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => removeDraft(draft.key)}
              >
                Remove
              </Button>
            )}
          </div>
          <Input
            label="Pass name"
            value={draft.name}
            onChange={(e) => updateDraft(draft.key, { name: e.target.value })}
            placeholder="Saturday pass, Social pass, Workshop A…"
            required
          />
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              value={draft.description}
              onChange={(e) =>
                updateDraft(draft.key, { description: e.target.value })
              }
              rows={2}
              placeholder="What is included in this pass?"
              className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground shadow-inner shadow-black/10 placeholder:text-muted/70 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Price (€)"
              type="number"
              min="0"
              step="0.01"
              value={draft.priceEuro}
              onChange={(e) =>
                updateDraft(draft.key, { priceEuro: e.target.value })
              }
              placeholder="25.00"
              required
            />
            <Select
              label="Pass category"
              value={draft.passType}
              onChange={(e) =>
                updateDraft(draft.key, {
                  passType: e.target.value as TicketPassType,
                })
              }
              options={PASS_TYPE_OPTIONS}
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addDraft}>
        Add another pass
      </Button>
    </div>
  );
}
