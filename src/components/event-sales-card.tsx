import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { EventTypeBadge } from "@/components/event-type-badge";
import { eventUsesRoleTickets } from "@/lib/event-sales";
import { formatEuro, formatEventSchedule } from "@/lib/utils";
import { getCountryName } from "@/lib/countries";
import type { EventWithSales } from "@/lib/event-sales";

export function EventSalesCard({
  event,
  manageHref,
}: {
  event: EventWithSales;
  manageHref: string;
}) {
  const showRoleBreakdown = eventUsesRoleTickets(event.event_type);

  return (
    <Link
      href={manageHref}
      className="group overflow-hidden rounded-2xl border border-border bg-surface-overlay shadow-lg shadow-black/20 transition-all hover:border-brand-800/40"
    >
      <div className="relative aspect-[3/2] bg-surface">
        {event.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.banner_url}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No banner
          </div>
        )}
        <div className="absolute right-3 top-3">
          <StatusBadge status={event.status} />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{event.name}</h2>
            <EventTypeBadge type={event.event_type ?? "competition"} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatEventSchedule(event.event_date, event.start_time, event.end_time)}
          </p>
          {event.country_code && (
            <p className="mt-1 text-sm text-muted">
              {getCountryName(event.country_code)}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface/60 p-3 text-sm">
          <div>
            <dt className="text-muted">Tickets sold</dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">
              {event.sales.ticketsSold}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Revenue</dt>
            <dd className="mt-1 text-lg font-semibold text-emerald-400">
              {formatEuro(event.sales.revenueCents)}
            </dd>
          </div>
        </dl>

        {showRoleBreakdown && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-surface/40 px-3 py-2">
              <p className="text-muted">Leader passes</p>
              <p className="mt-1 font-semibold text-foreground">
                {event.sales.leaderSold}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/40 px-3 py-2">
              <p className="text-muted">Follower passes</p>
              <p className="mt-1 font-semibold text-foreground">
                {event.sales.followerSold}
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
