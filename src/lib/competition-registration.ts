import { isCompetitionEvent } from "@/lib/events";
import type {
  Competition,
  Registration,
  RegistrationRole,
  TicketPurchase,
} from "@/types/database";

/** Paid J&J competitions: apply first, pay after organizer approval. */
export function competitionUsesApplyBeforePay(
  event: Pick<Competition, "event_type">,
  hasPaidTickets: boolean
): boolean {
  return isCompetitionEvent(event.event_type) && hasPaidTickets;
}

export function userHasPaidCompetitionPass(
  purchases: TicketPurchase[],
  role: RegistrationRole
): boolean {
  return purchases.some(
    (purchase) =>
      purchase.status === "paid" &&
      purchase.role === role &&
      (purchase.pass_type === "jj_pass" ||
        purchase.pass_type === "standard" ||
        purchase.pass_type == null)
  );
}

export function isRegistrationConfirmed(
  registration: Pick<Registration, "status" | "role">,
  paidPurchases: TicketPurchase[],
  requiresPayment: boolean
): boolean {
  if (registration.status !== "approved") return false;
  if (!requiresPayment) return true;
  return userHasPaidCompetitionPass(paidPurchases, registration.role);
}

export function filterConfirmedRegistrations<
  T extends Pick<Registration, "status" | "user_id" | "role">,
>(registrations: T[], paidPurchases: TicketPurchase[], requiresPayment: boolean): T[] {
  const approved = registrations.filter((registration) => registration.status === "approved");
  if (!requiresPayment) return approved;

  return approved.filter((registration) =>
    userHasPaidCompetitionPass(
      paidPurchases.filter((purchase) => purchase.user_id === registration.user_id),
      registration.role
    )
  );
}

export function paidUserIdsForCompetition(purchases: TicketPurchase[]): Set<string> {
  return new Set(
    purchases
      .filter((purchase) => purchase.status === "paid" && purchase.user_id)
      .map((purchase) => purchase.user_id as string)
  );
}
