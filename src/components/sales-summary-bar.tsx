import { formatEuro } from "@/lib/utils";
import type { EventSalesStats } from "@/lib/event-sales";

export function SalesSummaryBar({ totals }: { totals: EventSalesStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryTile label="Total tickets sold" value={String(totals.ticketsSold)} />
      <SummaryTile
        label="Total revenue"
        value={formatEuro(totals.revenueCents)}
        accent
      />
      <SummaryTile label="Leader passes sold" value={String(totals.leaderSold)} />
      <SummaryTile label="Follower passes sold" value={String(totals.followerSold)} />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-overlay p-5 shadow-lg shadow-black/20">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${accent ? "text-emerald-400" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
