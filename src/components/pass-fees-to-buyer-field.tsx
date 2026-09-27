"use client";

import { BUYER_FEE_FIXED_CENTS, BUYER_FEE_RATE } from "@/lib/ticket-pricing";

const FEE_PERCENT_LABEL = `${BUYER_FEE_RATE * 100}%`;
const FEE_FIXED_LABEL = `€${(BUYER_FEE_FIXED_CENTS / 100).toFixed(2)}`;

export function PassFeesToBuyerField({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 rounded border-border bg-surface-raised text-brand-500 focus:ring-brand-600/30"
        />
        <span className="text-sm text-foreground">
          Add processing fee to ticket prices ({FEE_PERCENT_LABEL} + {FEE_FIXED_LABEL}{" "}
          per ticket)
        </span>
      </label>
      <p className="pl-6 text-xs text-muted">
        {checked
          ? "Buyers pay the fee on top of your listed price. Each pass shows the final price in parentheses."
          : "You absorb the fee — set prices as you want buyers to pay."}
      </p>
    </div>
  );
}
