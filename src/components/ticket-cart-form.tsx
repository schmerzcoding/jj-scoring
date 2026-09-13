"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/ticket-pricing";
import { formatPassTypeLabel } from "@/lib/ticket-pass";
import type { TicketPurchase, TicketType } from "@/types/database";

export function TicketCartForm({
  eventId,
  eventName,
  ticketTypes,
  ownedTypeIds,
}: {
  eventId: string;
  eventName: string;
  ticketTypes: TicketType[];
  ownedTypeIds: string[];
}) {
  const availableTypes = ticketTypes.filter(
    (type) => type.is_active && type.price_cents > 0 && !ownedTypeIds.includes(type.id)
  );

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cartLines = useMemo(() => {
    return availableTypes
      .map((type) => ({
        ticketTypeId: type.id,
        quantity: quantities[type.id] ?? 0,
        type,
      }))
      .filter((line) => line.quantity > 0);
  }, [availableTypes, quantities]);

  const totalCents = cartLines.reduce(
    (sum, line) => sum + line.type.price_cents * line.quantity,
    0
  );

  function setQuantity(typeId: string, next: number) {
    setQuantities((current) => ({
      ...current,
      [typeId]: Math.max(0, Math.min(10, next)),
    }));
  }

  async function handleCheckout() {
    if (cartLines.length === 0) {
      setError("Select at least one pass to continue.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: eventId,
          items: cartLines.map((line) => ({
            ticketTypeId: line.ticketTypeId,
            quantity: line.quantity,
          })),
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

  if (availableTypes.length === 0) {
    return null;
  }

  return (
    <Card title="Buy tickets">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Select one or more passes for {eventName}. Each pass gets its own QR code
          after payment.
        </p>

        <div className="space-y-3">
          {availableTypes.map((type) => (
            <div
              key={type.id}
              className="rounded-xl border border-border bg-surface-raised/60 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{type.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatPassTypeLabel(type.pass_type, type.role)} ·{" "}
                    {formatPrice(type.price_cents)}
                  </p>
                  {type.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setQuantity(type.id, (quantities[type.id] ?? 0) - 1)
                    }
                    disabled={(quantities[type.id] ?? 0) <= 0}
                  >
                    −
                  </Button>
                  <span className="w-8 text-center text-sm font-medium text-foreground">
                    {quantities[type.id] ?? 0}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setQuantity(type.id, (quantities[type.id] ?? 0) + 1)
                    }
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalCents > 0 && (
          <div className="rounded-xl border border-border bg-surface-overlay px-4 py-3">
            <p className="text-sm text-muted">
              Cart total:{" "}
              <span className="font-semibold text-foreground">
                {formatPrice(totalCents)}
              </span>
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="button"
          loading={loading}
          disabled={cartLines.length === 0}
          onClick={() => void handleCheckout()}
        >
          {loading ? "Redirecting..." : "Proceed to checkout"}
        </Button>

        <p className="text-xs text-muted">
          Secure payment via Stripe. You can buy multiple different passes in one
          checkout.
        </p>
      </div>
    </Card>
  );
}

export function getOwnedTicketTypeIds(purchases: TicketPurchase[]): string[] {
  return purchases
    .filter((purchase) => purchase.status === "paid" && purchase.ticket_type_id)
    .map((purchase) => purchase.ticket_type_id as string);
}
