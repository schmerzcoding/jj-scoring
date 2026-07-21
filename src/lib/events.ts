import type { EventType } from "@/types/database";

export const EVENT_TYPES = [
  "social",
  "workshop",
  "masterclass",
  "congress",
  "competition",
] as const satisfies readonly EventType[];

export function eventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    social: "Social",
    workshop: "Workshop",
    masterclass: "Masterclass",
    congress: "Congress",
    competition: "Competition",
  };
  return labels[type];
}

export function isCompetitionEvent(type: EventType): boolean {
  return type === "competition";
}

export function isClassEvent(type: EventType): boolean {
  return type === "workshop" || type === "masterclass";
}

export const EVENT_TYPE_SELECT_OPTIONS = EVENT_TYPES.map((type) => ({
  value: type,
  label: eventTypeLabel(type),
}));
