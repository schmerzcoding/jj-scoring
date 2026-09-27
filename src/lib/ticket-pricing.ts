import { isCompetitionEvent } from "@/lib/events";
import type { Competition, RegistrationRole } from "@/types/database";

/** Fixed fee (€0.25) and rate (1.5%) passed to buyers when enabled. */
export const BUYER_FEE_FIXED_CENTS = 25;
export const BUYER_FEE_RATE = 0.015;

export const TICKET_VAT_NOTICE =
  "Ticket prices include VAT as required by Irish regulatory authorities.";

/** Final buyer price: (base + €0.25) / (1 - 1.5%). */
export function applyBuyerFeeCents(basePriceCents: number): number {
  if (basePriceCents <= 0) return basePriceCents;
  return Math.round(
    (basePriceCents + BUYER_FEE_FIXED_CENTS) / (1 - BUYER_FEE_RATE)
  );
}

export function resolveCheckoutPriceCents(
  basePriceCents: number,
  passFeesToBuyer: boolean
): number {
  if (basePriceCents <= 0) return basePriceCents;
  return passFeesToBuyer
    ? applyBuyerFeeCents(basePriceCents)
    : basePriceCents;
}

export function formatBuyerFeePreview(euroInput: string): string | null {
  const cents = parseEuroInputToCents(euroInput);
  if (cents == null || cents <= 0) return null;
  return formatPrice(applyBuyerFeeCents(cents));
}

export function formatPriceLabelWithBuyerFee(
  baseLabel: string,
  euroInput: string,
  passFeesToBuyer: boolean
): string {
  if (!passFeesToBuyer) return baseLabel;
  const preview = formatBuyerFeePreview(euroInput);
  return preview ? `${baseLabel} (${preview})` : baseLabel;
}

export function resolveTicketPriceCents(
  event: Pick<
    Competition,
    | "event_type"
    | "ticket_price_cents"
    | "leader_price_cents"
    | "follower_price_cents"
  >,
  role?: RegistrationRole | null
): number | null {
  if (isCompetitionEvent(event.event_type)) {
    if (role === "leader" && event.leader_price_cents != null) {
      return event.leader_price_cents;
    }
    if (role === "follower" && event.follower_price_cents != null) {
      return event.follower_price_cents;
    }
  }

  return event.ticket_price_cents;
}

export function eventHasPaidTickets(
  event: Pick<
    Competition,
    | "event_type"
    | "ticket_price_cents"
    | "leader_price_cents"
    | "follower_price_cents"
  >
): boolean {
  if (event.ticket_price_cents != null && event.ticket_price_cents > 0) {
    return true;
  }

  if (isCompetitionEvent(event.event_type)) {
    return (
      (event.leader_price_cents != null && event.leader_price_cents > 0) ||
      (event.follower_price_cents != null && event.follower_price_cents > 0)
    );
  }

  return false;
}

export function formatPrice(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function parseEuroInputToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(",", ".");
  const euros = Number(normalized);
  if (!Number.isFinite(euros) || euros < 0) return null;

  return Math.round(euros * 100);
}

export function formatCentsToEuroInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}
