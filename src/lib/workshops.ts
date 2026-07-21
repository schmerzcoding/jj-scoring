import type { DanceStyle, WorkshopLevel } from "@/types/database";

export const DANCE_STYLES = [
  "salsa",
  "bachata",
  "kizomba",
  "zouk",
  "other",
] as const satisfies readonly DanceStyle[];

export const WORKSHOP_LEVELS = [
  "beginners",
  "improvers",
  "intermediate",
  "advanced",
  "open_level",
] as const satisfies readonly WorkshopLevel[];

export function danceStyleLabel(style: DanceStyle): string {
  const labels: Record<DanceStyle, string> = {
    salsa: "Salsa",
    bachata: "Bachata",
    kizomba: "Kizomba",
    zouk: "Zouk",
    other: "Other",
  };
  return labels[style];
}

export function workshopLevelLabel(level: WorkshopLevel): string {
  const labels: Record<WorkshopLevel, string> = {
    beginners: "Beginners",
    improvers: "Improvers",
    intermediate: "Intermediate",
    advanced: "Advanced",
    open_level: "Open Level",
  };
  return labels[level];
}

export const DANCE_STYLE_SELECT_OPTIONS = DANCE_STYLES.map((style) => ({
  value: style,
  label: danceStyleLabel(style),
}));

export const WORKSHOP_LEVEL_OPTIONS = WORKSHOP_LEVELS.map((level) => ({
  value: level,
  label: workshopLevelLabel(level),
}));

export function formatDanceStyle(
  style: DanceStyle | null,
  other: string | null
): string | null {
  if (!style) return null;
  if (style === "other") {
    return other?.trim() ? other.trim() : danceStyleLabel(style);
  }
  return danceStyleLabel(style);
}

export function parseInstructors(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function formatInstructors(instructors: string | null): string[] {
  if (!instructors?.trim()) return [];
  return parseInstructors(instructors);
}
