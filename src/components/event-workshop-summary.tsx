import {
  formatDanceStyle,
  formatInstructors,
  workshopLevelLabel,
} from "@/lib/workshops";
import { isClassEvent } from "@/lib/events";
import type { Competition } from "@/types/database";

export function EventWorkshopSummary({ event }: { event: Competition }) {
  if (!isClassEvent(event.event_type)) return null;

  const styleLabel = formatDanceStyle(event.dance_style, event.dance_style_other);
  const levels = event.workshop_levels ?? [];
  const instructorNames = formatInstructors(event.instructors);
  const topic = event.masterclass_topic?.trim();

  if (
    !styleLabel &&
    levels.length === 0 &&
    instructorNames.length === 0 &&
    !topic
  ) {
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
      {topic && (
        <div>
          <dt className="font-medium text-foreground">Theme or topic</dt>
          <dd className="text-muted">{topic}</dd>
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
