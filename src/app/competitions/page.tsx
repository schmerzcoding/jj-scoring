import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function CompetitionsPage() {
  const supabase = await createClient();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .neq("status", "draft")
    .order("event_date", { ascending: true });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Competitions</h1>
      <p className="mt-2 text-gray-600">
        Browse open and upcoming Jack & Jill events.
      </p>

      <div className="mt-8 grid gap-4">
        {competitions?.length === 0 && (
          <p className="text-gray-500">No competitions available yet.</p>
        )}
        {competitions?.map((comp) => (
          <Link
            key={comp.id}
            href={`/competitions/${comp.id}`}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{comp.name}</h2>
              {comp.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                  {comp.description}
                </p>
              )}
              <div className="mt-2 flex gap-4 text-sm text-gray-500">
                {comp.location && <span>{comp.location}</span>}
                <span>{formatDate(comp.event_date)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {comp.registration_open && (
                <span className="text-xs font-medium text-green-600">
                  Registration open
                </span>
              )}
              <StatusBadge status={comp.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
