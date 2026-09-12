import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { EventTypeBadge } from "@/components/event-type-badge";
import { formatDate } from "@/lib/utils";
import { formatPassTypeLabel } from "@/lib/ticket-pass";
import type { TicketWithEvent } from "@/lib/profile-tickets";

export function MyEventsSection({
  upcoming,
  past,
  className,
}: {
  upcoming: TicketWithEvent[];
  past: TicketWithEvent[];
  className?: string;
}) {
  return (
    <Card
      title="My events"
      description="Events you have a ticket for — show your QR code at the door"
      className={className}
    >
      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No tickets yet"
          description="Buy a ticket for an upcoming event and it will appear here with your entry QR code."
          compact
          action={
            <Link href="/competitions">
              <Button size="sm">Browse events</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <TicketList title="Upcoming" tickets={upcoming} />
          )}
          {past.length > 0 && (
            <TicketList title="Past events" tickets={past} muted />
          )}
        </div>
      )}
    </Card>
  );
}

function TicketList({
  title,
  tickets,
  muted = false,
}: {
  title: string;
  tickets: TicketWithEvent[];
  muted?: boolean;
}) {
  return (
    <div>
      <h3
        className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
          muted ? "text-muted" : "text-muted-foreground"
        }`}
      >
        {title}
      </h3>
      <div className="divide-y divide-border">
        {tickets.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} muted={muted} />
        ))}
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  muted,
}: {
  ticket: TicketWithEvent;
  muted?: boolean;
}) {
  const { competition } = ticket;

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/profile/tickets/${ticket.id}`}
            className="font-medium text-foreground transition-colors hover:text-brand-400"
          >
            {competition.name}
          </Link>
          <EventTypeBadge type={competition.event_type} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{formatPassTypeLabel(ticket.pass_type, ticket.role)}</span>
          <span>·</span>
          <span>{formatDate(competition.event_date)}</span>
          {competition.location && (
            <>
              <span>·</span>
              <span>{competition.location}</span>
            </>
          )}
        </div>
        {ticket.checked_in_at && (
          <p className="mt-1 text-xs text-emerald-400">Checked in</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={competition.status} />
        {!muted && (
          <Link href={`/profile/tickets/${ticket.id}`}>
            <Button size="sm" variant="secondary">
              View QR
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
