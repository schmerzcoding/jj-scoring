import Link from "next/link";
import { formatEventDateRange, formatEventSchedule } from "@/lib/utils";
import { waddleCupEventPath } from "@/lib/waddle-cup";
import type { Competition } from "@/types/database";

export function WaddleCupPromoBanner({ event }: { event: Competition }) {
  const scheduleLabel =
    event.start_time || event.end_time
      ? formatEventSchedule(
          event.event_date,
          event.start_time,
          event.event_end_date,
          event.end_time
        )
      : formatEventDateRange(event.event_date, event.event_end_date);

  return (
    <Link
      href={waddleCupEventPath(event.id)}
      className="group block rounded-2xl border border-[color-mix(in_srgb,#8115d7_32%,#30004e_38%,#000_30%)] bg-[color-mix(in_srgb,#8115d7_12%,#30004e_22%,#000_66%)] p-6 shadow-lg shadow-black/25 transition-all hover:border-[color-mix(in_srgb,#8115d7_42%,#30004e_48%)] hover:bg-[color-mix(in_srgb,#8115d7_16%,#30004e_26%,#000_58%)] hover:shadow-[0_12px_40px_rgba(48,0,78,0.35)] sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color-mix(in_srgb,#ffffff_70%,#8115d7_30%)]">
            Featured event
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {event.name}
          </h2>
          <p className="mt-2 text-sm text-[color-mix(in_srgb,#ffffff_82%,#8115d7_18%)] sm:text-base">
            Workshops · Competition · Social
          </p>
          {scheduleLabel !== "TBD" && (
            <p className="mt-3 text-sm text-white/75">{scheduleLabel}</p>
          )}
          {event.location && (
            <p className="mt-1 text-sm text-white/60">{event.location}</p>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors group-hover:border-white/25 group-hover:bg-white/10 sm:self-center">
          View event
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
