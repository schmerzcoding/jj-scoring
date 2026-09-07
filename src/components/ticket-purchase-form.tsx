"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice, resolveTicketPriceCents } from "@/lib/ticket-pricing";
import { isCompetitionEvent } from "@/lib/events";
import type { Competition, RegistrationRole } from "@/types/database";

export function TicketPurchaseForm({
  event,
}: {
  event: Competition;
}) {
  const isCompetition = isCompetitionEvent(event.event_type);
  const [role, setRole] = useState<RegistrationRole>("leader");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const priceCents = resolveTicketPriceCents(event, isCompetition ? role : null);

  async function handleCheckout() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: event.id,
          role: isCompetition ? role : undefined,
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
    <Card title="Buy your ticket">
      <div className="space-y-4">
        {isCompetition && (
          <Select
            label="Pass type"
            value={role}
            onChange={(e) => setRole(e.target.value as RegistrationRole)}
            options={[
              {
                value: "leader",
                label: `Leader${
                  event.leader_price_cents
                    ? ` — ${formatPrice(event.leader_price_cents)}`
                    : ""
                }`,
              },
              {
                value: "follower",
                label: `Follower${
                  event.follower_price_cents
                    ? ` — ${formatPrice(event.follower_price_cents)}`
                    : ""
                }`,
              },
            ]}
          />
        )}

        {priceCents != null && priceCents > 0 && (
          <p className="text-sm text-muted">
            Total:{" "}
            <span className="font-semibold text-foreground">
              {formatPrice(priceCents)}
            </span>
          </p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="button" loading={loading} onClick={() => void handleCheckout()}>
          {loading ? "Redirecting..." : "Pay with Stripe"}
        </Button>

        <p className="text-xs text-muted">
          Secure payment via Stripe. For competitions, your registration will be
          submitted for organizer approval after payment.
        </p>
      </div>
    </Card>
  );
}
