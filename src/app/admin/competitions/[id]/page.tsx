import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { RegistrationsPanel } from "./registrations-panel";
import { RoundsPanel } from "./rounds-panel";
import { JudgesPanel } from "./judges-panel";
import { CompetitionSettings } from "./competition-settings";

export default async function AdminCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();
  if (!competition) notFound();

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*, profile:profiles(*)")
    .eq("competition_id", id)
    .order("created_at", { ascending: false });

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("order_index");

  const { data: judges } = await supabase
    .from("competition_judges")
    .select("*, profile:profiles(*)")
    .eq("competition_id", id);

  const { data: allJudges } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "judge");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-brand-600 hover:underline">
          &larr; Back to dashboard
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{competition.name}</h1>
            <div className="mt-2 flex gap-4 text-sm text-gray-500">
              {competition.location && <span>{competition.location}</span>}
              <span>{formatDate(competition.event_date)}</span>
            </div>
          </div>
          <StatusBadge status={competition.status} />
        </div>
      </div>

      {competition.status === "draft" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            This competition is in <strong>draft</strong> and is hidden from
            the public list. Change status to <strong>Open</strong> below and
            enable registration when you are ready.
          </p>
        </div>
      )}

      <CompetitionSettings competition={competition} />

      <RegistrationsPanel registrations={registrations ?? []} />

      <RoundsPanel competitionId={id} rounds={rounds ?? []} />

      <JudgesPanel
        competitionId={id}
        assignedJudges={judges ?? []}
        availableJudges={allJudges ?? []}
      />
    </div>
  );
}
