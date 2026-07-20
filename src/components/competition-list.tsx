"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    return <p className="text-gray-500">No competitions available yet.</p>;
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((competition) => (
          <article
            key={competition.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[3/2] bg-gray-100">
              {competition.banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={competition.banner_url}
                  alt={competition.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No banner
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {competition.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(competition.event_date)}
                </p>
                {competition.country_code && (
                  <p className="mt-1 text-sm text-gray-500">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
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
                    className="text-xl font-bold text-gray-900"
                  >
                    {selected.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(selected.event_date)}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <dl className="grid gap-2 text-sm">
                {selected.country_code && (
                  <div>
                    <dt className="font-medium text-gray-700">Country</dt>
                    <dd className="text-gray-600">
                      {getCountryName(selected.country_code)}
                    </dd>
                  </div>
                )}
                {selected.location && (
                  <div>
                    <dt className="font-medium text-gray-700">Location</dt>
                    <dd className="text-gray-600">{selected.location}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-gray-700">Registration</dt>
                  <dd className="text-gray-600">
                    {selected.registration_open ? "Open" : "Closed"}
                  </dd>
                </div>
              </dl>

              {selected.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Description
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
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
