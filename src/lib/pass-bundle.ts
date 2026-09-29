import { fetchWaddleCupEvents, waddleCupEventIds } from "@/lib/waddle-cup";
import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { TicketPassType, TicketPurchase, TicketType } from "@/types/database";

/** Social pass value credited when buying passes that already include the social. */
export const SOCIAL_PASS_CREDIT_CENTS = 1500;

export type PassEntitlements = {
  hasSocialPass: boolean;
  hasFullPass: boolean;
  hasJjPass: boolean;
};

export function derivePassEntitlements(purchases: TicketPurchase[]): PassEntitlements {
  return {
    hasSocialPass: purchases.some(
      (purchase) => purchase.status === "paid" && purchase.pass_type === "social_pass"
    ),
    hasFullPass: purchases.some(
      (purchase) => purchase.status === "paid" && purchase.pass_type === "full_pass"
    ),
    hasJjPass: purchases.some(
      (purchase) =>
        purchase.status === "paid" &&
        (purchase.pass_type === "jj_pass" ||
          ((purchase.pass_type === "standard" || purchase.pass_type == null) &&
            (purchase.role === "leader" || purchase.role === "follower")))
    ),
  };
}

export async function resolveBundledEventIds(
  supabase: AppSupabaseClient,
  competitionId: string
): Promise<string[]> {
  const waddleCup = await fetchWaddleCupEvents(supabase);
  const bundleIds = waddleCupEventIds(waddleCup);
  if (bundleIds.includes(competitionId)) {
    return bundleIds;
  }
  return [competitionId];
}

export async function getUserPassEntitlementsForBundle(
  supabase: AppSupabaseClient,
  userId: string,
  competitionId: string
): Promise<{ entitlements: PassEntitlements; relatedEventIds: string[] }> {
  const relatedEventIds = await resolveBundledEventIds(supabase, competitionId);
  const { data } = await supabase
    .from("ticket_purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "paid")
    .in("competition_id", relatedEventIds);

  return {
    entitlements: derivePassEntitlements(data ?? []),
    relatedEventIds,
  };
}

export function canPurchasePassType(
  passType: TicketPassType,
  entitlements: PassEntitlements
): { allowed: true } | { allowed: false; reason: string } {
  if (passType === "social_pass") {
    if (entitlements.hasFullPass) {
      return {
        allowed: false,
        reason:
          "Your Full Pass already includes the social. You cannot buy a separate Social Pass.",
      };
    }
    if (entitlements.hasJjPass) {
      return {
        allowed: false,
        reason:
          "Your competitor pass already includes the social. You cannot buy a separate Social Pass.",
      };
    }
  }

  return { allowed: true };
}

export function getSocialPassCreditCents(
  targetPassType: TicketPassType,
  entitlements: PassEntitlements
): number {
  if (targetPassType === "jj_pass") {
    if (entitlements.hasSocialPass || entitlements.hasFullPass) {
      return SOCIAL_PASS_CREDIT_CENTS;
    }
  }

  if (targetPassType === "full_pass") {
    if (entitlements.hasSocialPass || entitlements.hasJjPass) {
      return SOCIAL_PASS_CREDIT_CENTS;
    }
  }

  return 0;
}

export function applySocialPassCredit(basePriceCents: number, creditCents: number): number {
  return Math.max(0, basePriceCents - creditCents);
}

export function getSocialPassCreditLabel(
  targetPassType: TicketPassType,
  entitlements: PassEntitlements
): string | null {
  const credit = getSocialPassCreditCents(targetPassType, entitlements);
  if (credit <= 0) return null;

  if (targetPassType === "jj_pass") {
    if (entitlements.hasFullPass) {
      return "€15 off — social included in your Full Pass";
    }
    return "€15 off — you already have a Social Pass";
  }

  if (targetPassType === "full_pass") {
    if (entitlements.hasJjPass) {
      return "€15 off — social included in your competitor pass";
    }
    return "€15 off — you already have a Social Pass";
  }

  return null;
}

export function filterAvailableTicketTypes(
  ticketTypes: TicketType[],
  ownedTypeIds: string[],
  entitlements: PassEntitlements | null
): TicketType[] {
  const owned = new Set(ownedTypeIds);

  return ticketTypes.filter((type) => {
    if (!type.is_active || type.price_cents <= 0 || owned.has(type.id)) {
      return false;
    }

    if (entitlements) {
      const eligibility = canPurchasePassType(type.pass_type, entitlements);
      if (!eligibility.allowed) return false;
    }

    return true;
  });
}

export function resolvePassTypeForCheckout(
  ticketType: TicketType | undefined,
  isCompetition: boolean
): TicketPassType {
  if (ticketType?.pass_type) return ticketType.pass_type;
  if (isCompetition) return "jj_pass";
  return "standard";
}
