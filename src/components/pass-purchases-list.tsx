"use client";

import { useMemo, useState } from "react";
import { UserAvatar } from "@/components/avatar-upload";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { formatPassTypeLabel } from "@/lib/ticket-pass";
import { formatDate, formatEuro } from "@/lib/utils";
import type { PaidPassPurchaseRow } from "@/lib/pass-purchases-server";
import type { TicketPassType } from "@/types/database";

const PASS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All pass types" },
  { value: "full_pass", label: "Full Pass" },
  { value: "social_pass", label: "Social Pass" },
  { value: "jj_pass", label: "J&J Pass" },
  { value: "standard", label: "General admission" },
];

export function PassPurchasesList({
  purchases,
  showEventColumn = true,
}: {
  purchases: PaidPassPurchaseRow[];
  showEventColumn?: boolean;
}) {
  const [passFilter, setPassFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (passFilter === "all") return purchases;
    return purchases.filter((row) => row.passType === passFilter);
  }, [passFilter, purchases]);

  const countsByPass = useMemo(() => {
    const counts = new Map<TicketPassType, number>();
    for (const row of purchases) {
      counts.set(row.passType, (counts.get(row.passType) ?? 0) + 1);
    }
    return counts;
  }, [purchases]);

  return (
    <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Paid passes</h2>
          <p className="mt-1 text-sm text-muted">
            {purchases.length} paid purchase{purchases.length === 1 ? "" : "s"} across all pass
            types.
          </p>
        </div>
        <Select
          label="Filter by pass"
          value={passFilter}
          onChange={(e) => setPassFilter(e.target.value)}
          options={PASS_FILTER_OPTIONS}
          className="w-full sm:w-56"
        />
      </div>

      {purchases.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(["full_pass", "social_pass", "jj_pass", "standard"] as TicketPassType[]).map(
            (type) => {
              const count = countsByPass.get(type) ?? 0;
              if (count === 0) return null;
              return (
                <span
                  key={type}
                  className="rounded-full bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border"
                >
                  {formatPassTypeLabel(type)}: {count}
                </span>
              );
            }
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={purchases.length === 0 ? "No paid passes yet" : "No matches for this filter"}
          description={
            purchases.length === 0
              ? "Purchases will appear here once customers complete checkout."
              : "Try another pass type filter."
          }
          compact
          className="mt-6"
        />
      ) : (
        <div className="mt-6 divide-y divide-border">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar name={row.fullName} avatarUrl={row.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{row.fullName}</p>
                  <p className="text-sm text-muted">
                    {formatPassTypeLabel(row.passType, row.role)}
                    {row.passCode ? (
                      <span className="text-muted-foreground"> · {row.passCode}</span>
                    ) : null}
                  </p>
                  {showEventColumn && (
                    <p className="truncate text-xs text-muted-foreground">{row.competitionName}</p>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="font-semibold text-foreground">{formatEuro(row.amountCents)}</p>
                <p className="text-xs text-muted">{formatDate(row.purchasedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
