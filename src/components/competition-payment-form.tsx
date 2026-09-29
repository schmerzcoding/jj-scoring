"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  applySocialPassCredit,
  getSocialPassCreditCents,
  getSocialPassCreditLabel,
  type PassEntitlements,
} from "@/lib/pass-bundle";
import {
  formatPrice,
  resolveCheckoutPriceCents,
  resolveTicketPriceCents,
  TICKET_VAT_NOTICE,
} from "@/lib/ticket-pricing";
import type { Competition, RegistrationRole } from "@/types/database";

export function CompetitionPaymentForm({
  event,
  role,
  passEntitlements = null,
}: {
  event: Competition;
  role: RegistrationRole;
  passEntitlements?: PassEntitlements | null;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const basePriceCents = resolveTicketPriceCents(event, role);
  const creditCents =
    passEntitlements && basePriceCents != null
      ? getSocialPassCreditCents("jj_pass", passEntitlements)
      : 0;
  const discountedBaseCents =
    basePriceCents != null
      ? applySocialPassCredit(basePriceCents, creditCents)
      : null;
  const priceCents =
    discountedBaseCents != null
      ? resolveCheckoutPriceCents(discountedBaseCents, event.pass_fees_to_buyer ?? false)
      : null;
  const fullPriceCents =
    basePriceCents != null
      ? resolveCheckoutPriceCents(basePriceCents, event.pass_fees_to_buyer ?? false)
      : null;
  const creditLabel = passEntitlements
    ? getSocialPassCreditLabel("jj_pass", passEntitlements)
    : null;

  const roleLabel = role === "leader" ? "Leader" : "Follower";

  async function handleCheckout() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: event.id,
          role,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card title="Complete your registration">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Your application was approved. Complete payment to confirm your spot in the
          Jack &amp; Jill as a <span className="font-medium text-foreground">{roleLabel}</span>.
        </p>

        {priceCents != null && priceCents > 0 && (
          <div className="rounded-xl border border-border bg-surface-raised/60 p-4">
            <p className="text-sm text-muted">{roleLabel} competitor pass</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              {creditCents > 0 && fullPriceCents != null && (
                <span className="text-lg text-muted line-through">
                  {formatPrice(fullPriceCents)}
                </span>
              )}
              <p className="text-2xl font-semibold text-foreground">
                {formatPrice(priceCents)}
              </p>
            </div>
            {creditLabel && (
              <p className="mt-2 text-xs font-medium text-emerald-400">{creditLabel}</p>
            )}
            <p className="mt-2 text-xs text-muted">
              Includes the social pass for the day.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="button" loading={loading} onClick={() => void handleCheckout()}>
          {loading ? "Redirecting..." : "Complete payment to finalize registration"}
        </Button>

        <p className="text-xs text-muted">{TICKET_VAT_NOTICE}</p>
        <p className="text-xs text-muted">
          Secure payment via Stripe. After payment, your registration and ticket will be
          confirmed.
        </p>
      </div>
    </Card>
  );
}
