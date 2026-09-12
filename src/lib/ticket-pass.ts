import { isCompetitionEvent } from "@/lib/events";
import type { EventType, RegistrationRole, TicketPassType } from "@/types/database";

export function resolvePassTypeForPurchase(
  eventType: EventType,
  role?: RegistrationRole | null
): TicketPassType {
  if (isCompetitionEvent(eventType)) {
    return role ? "jj_pass" : "standard";
  }

  if (eventType === "social") {
    return "social_pass";
  }

  if (eventType === "congress") {
    return "full_pass";
  }

  return "standard";
}

export function formatPassTypeLabel(
  passType: TicketPassType,
  role?: RegistrationRole | null
): string {
  const labels: Record<TicketPassType, string> = {
    standard: "General admission",
    social_pass: "Social Pass",
    jj_pass: "J&J Pass",
    full_pass: "Full Pass",
  };

  const base = labels[passType];

  if (passType === "jj_pass" && role) {
    return `${base} (${role})`;
  }

  return base;
}
