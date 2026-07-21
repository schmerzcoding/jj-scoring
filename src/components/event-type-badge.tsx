import { cn, getStatusColor } from "@/lib/utils";
import { eventTypeLabel } from "@/lib/events";
import type { EventType } from "@/types/database";

export function EventTypeBadge({
  type,
  className,
}: {
  type: EventType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        getStatusColor(type),
        className
      )}
    >
      {eventTypeLabel(type)}
    </span>
  );
}
