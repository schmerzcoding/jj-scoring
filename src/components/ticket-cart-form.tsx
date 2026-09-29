"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatPrice,
  resolveCheckoutPriceCents,
  TICKET_VAT_NOTICE,
} from "@/lib/ticket-pricing";
import {
  applySocialPassCredit,
  filterAvailableTicketTypes,
  getSocialPassCreditCents,
  getSocialPassCreditLabel,
  type PassEntitlements,
} from "@/lib/pass-bundle";
import { formatPassTypeLabel } from "@/lib/ticket-pass";
import type { TicketType } from "@/types/database";

export function TicketCartForm({
  eventId,
  eventName,
  ticketTypes,
  ownedTypeIds,
  passFeesToBuyer = false,
  passEntitlements = null,
}: {
  eventId: string;
  eventName: string;
  ticketTypes: TicketType[];
  ownedTypeIds: string[];
  passFeesToBuyer?: boolean;
  passEntitlements?: PassEntitlements | null;
}) {
  const availableTypes = filterAvailableTicketTypes(
    ticketTypes,
    ownedTypeIds,
    passEntitlements
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

  function buyerPriceCents(type: TicketType): number {
    const creditCents = passEntitlements
      ? getSocialPassCreditCents(type.pass_type, passEntitlements)
      : 0;
    const discountedBase = applySocialPassCredit(type.price_cents, creditCents);
    return resolveCheckoutPriceCents(discountedBase, passFeesToBuyer);
  }

  const totalCents = cartLines.reduce(
    (sum, line) => sum + buyerPriceCents(line.type) * line.quantity,
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
          {availableTypes.map((type) => {
            const creditCents = passEntitlements
              ? getSocialPassCreditCents(type.pass_type, passEntitlements)
              : 0;
            const creditLabel = passEntitlements
              ? getSocialPassCreditLabel(type.pass_type, passEntitlements)
              : null;
            const displayPriceCents = buyerPriceCents(type);

            return (
            <div
              key={type.id}
              className="rounded-xl border border-border bg-surface-raised/60 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{type.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatPassTypeLabel(type.pass_type, type.role)} ·{" "}
                    {creditCents > 0 && (
                      <span className="mr-2 text-muted line-through">
                        {formatPrice(
                          resolveCheckoutPriceCents(type.price_cents, passFeesToBuyer)
                        )}
                      </span>
                    )}
                    <span className="font-medium text-foreground">
                      {formatPrice(displayPriceCents)}
                    </span>
                  </p>
                  {creditLabel && (
                    <p className="mt-1 text-xs font-medium text-emerald-400">{creditLabel}</p>
                  )}
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
          );
          })}
        </div>

        {cartLines.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-overlay px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your selection
            </p>
            <ul className="mt-2 space-y-2">
              {cartLines.map((line) => {
                const unitCents = buyerPriceCents(line.type);
                const lineTotalCents = unitCents * line.quantity;
                return (
                  <li
                    key={line.ticketTypeId}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="text-foreground">
                      {line.quantity}× {line.type.name}
                      <span className="block text-xs text-muted">
                        {formatPassTypeLabel(line.type.pass_type, line.type.role)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right font-medium text-foreground">
                      {formatPrice(lineTotalCents)}
                      {line.quantity > 1 && (
                        <span className="block text-xs font-normal text-muted">
                          {formatPrice(unitCents)} each
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted">Cart total</span>
              <span className="text-sm font-semibold text-foreground">
                {formatPrice(totalCents)}
              </span>
            </div>
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

        <p className="text-xs text-muted">{TICKET_VAT_NOTICE}</p>
        <p className="text-xs text-muted">
          Secure payment via Stripe. You can buy multiple different passes in one
          checkout.
        </p>
      </div>
    </Card>
  );
}
