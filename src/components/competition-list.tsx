"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { getCountryName } from "@/lib/countries";
import type { Competition } from "@/types/database";

export function CompetitionList({
  competitions,
}: {
  competitions: Competition[];
}) {
  const [selected, setSelected] = useState<Competition | null>(null);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (competitions.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="No competitions yet"
        description="Check back soon — new events will appear here when organizers publish them."
      />
    );
  }

  return (
    <>
      <div className="stagger-children grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((competition) => (
          <article
            key={competition.id}
            className="overflow-hidden rounded-2xl border border-border bg-surface-overlay shadow-lg shadow-black/20 transition-all hover:border-brand-800/40"
          >
            <div className="relative aspect-[3/2] bg-surface">
              {competition.banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={competition.banner_url}
                  alt={competition.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No banner
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {competition.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(competition.event_date)}
                </p>
                {competition.country_code && (
                  <p className="mt-1 text-sm text-muted">
                    {getCountryName(competition.country_code)}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setSelected(competition)}
              >
                View details
              </Button>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-overlay shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="competition-modal-title"
          >
            {selected.banner_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.banner_url}
                alt=""
                className="aspect-[3/1] w-full object-cover"
              />
            )}

            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="competition-modal-title"
                    className="text-xl font-bold text-foreground"
                  >
                    {selected.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(selected.event_date)}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <dl className="grid gap-2 text-sm">
                {selected.country_code && (
                  <div>
                    <dt className="font-medium text-foreground">Country</dt>
                    <dd className="text-muted">
                      {getCountryName(selected.country_code)}
                    </dd>
                  </div>
                )}
                {selected.location && (
                  <div>
                    <dt className="font-medium text-foreground">Location</dt>
                    <dd className="text-muted">{selected.location}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-foreground">Registration</dt>
                  <dd className="text-muted">
                    {selected.registration_open ? "Open" : "Closed"}
                  </dd>
                </div>
              </dl>

              {selected.description && (
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Description
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                    {selected.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href={`/competitions/${selected.id}`}>
                  <Button>Go to competition</Button>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
