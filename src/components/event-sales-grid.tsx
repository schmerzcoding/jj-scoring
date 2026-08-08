import { EmptyState } from "@/components/ui/empty-state";
import { EventSalesCard } from "@/components/event-sales-card";
import type { EventWithSales } from "@/lib/event-sales";

export function EventSalesGrid({
  events,
  manageBasePath,
  emptyTitle = "No events yet",
  emptyDescription = "Ticket sales will appear here once you create events and start selling passes.",
}: {
  events: EventWithSales[];
  manageBasePath: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="stagger-children grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventSalesCard
          key={event.id}
          event={event}
          manageHref={`${manageBasePath}/${event.id}`}
        />
      ))}
    </div>
  );
}
