import {
  formatDanceStyle,
  formatInstructors,
  workshopLevelLabel,
} from "@/lib/workshops";
import type { Competition } from "@/types/database";

export function EventWorkshopSummary({ event }: { event: Competition }) {
  if (event.event_type !== "workshop") return null;

  const styleLabel = formatDanceStyle(event.dance_style, event.dance_style_other);
  const levels = event.workshop_levels ?? [];
  const instructorNames = formatInstructors(event.instructors);

  if (!styleLabel && levels.length === 0 && instructorNames.length === 0) {
    return null;
  }

  return (
    <dl className="grid gap-3 text-sm">
      {styleLabel && (
        <div>
          <dt className="font-medium text-foreground">Dance style</dt>
          <dd className="text-muted">{styleLabel}</dd>
        </div>
      )}
      {levels.length > 0 && (
        <div>
          <dt className="font-medium text-foreground">Levels</dt>
          <dd className="text-muted">
            {levels.map((level) => workshopLevelLabel(level)).join(", ")}
          </dd>
        </div>
      )}
      {instructorNames.length > 0 && (
        <div>
          <dt className="font-medium text-foreground">Instructor(s)</dt>
          <dd className="text-muted">{instructorNames.join(", ")}</dd>
        </div>
      )}
    </dl>
  );
}
