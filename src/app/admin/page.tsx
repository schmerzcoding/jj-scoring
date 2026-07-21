import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { EventTypeBadge } from "@/components/event-type-badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ResetCompetitionsButton } from "./reset-competitions-button";

export default async function AdminDashboard() {
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

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .order("created_at", { ascending: false });

  const { count: pendingCount } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { data: pendingRegistrations } = await supabase
    .from("registrations")
    .select("id, role, status, competition_id, display_name, user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const pendingCompetitionIds = [
    ...new Set(pendingRegistrations?.map((r) => r.competition_id) ?? []),
  ];
  const { data: pendingCompetitions } =
    pendingCompetitionIds.length > 0
      ? await supabase
          .from("competitions")
          .select("id, name")
          .in("id", pendingCompetitionIds)
      : { data: [] as { id: string; name: string }[] };

  const competitionNameById = new Map(
    pendingCompetitions?.map((c) => [c.id, c.name]) ?? []
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-muted">Manage events, users, and registrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/users">
            <Button variant="secondary">Users</Button>
          </Link>
          <Link href="/admin/competitions/new">
            <Button>New Event</Button>
          </Link>
        </div>
      </div>

      {pendingCount !== null && pendingCount > 0 && (
        <div className="space-y-3 rounded-xl border border-amber-800/50 bg-amber-950/40 p-4">
          <p className="text-sm text-amber-200">
            {pendingCount} registration{pendingCount > 1 ? "s" : ""} pending
            approval. Open the competition below and use{" "}
            <strong className="text-amber-100">Approve</strong> in the
            Registrations section.
          </p>
          <ul className="space-y-2">
            {pendingRegistrations?.map((registration) => (
              <li key={registration.id}>
                <Link
                  href={`/admin/competitions/${registration.competition_id}`}
                  className="text-sm font-medium text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Review: {registration.display_name ?? "Participant"} (
                  {registration.role}) —{" "}
                  {competitionNameById.get(registration.competition_id) ??
                    "Competition"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-foreground">Events</h2>
        <div className="mt-4 grid gap-4">
          {competitions?.length === 0 && (
            <EmptyState
              icon="calendar"
              title="No events yet"
              description="Create your first dance event to get started."
              action={
                <Link href="/admin/competitions/new">
                  <Button>New Event</Button>
                </Link>
              }
            />
          )}
          <div className="stagger-children grid gap-4">
          {competitions?.map((comp) => (
            <Link
              key={comp.id}
              href={`/admin/competitions/${comp.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20 transition-all hover:border-brand-800/40"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground">{comp.name}</h3>
                  <EventTypeBadge type={comp.event_type ?? "competition"} />
                </div>
                <div className="mt-1 flex gap-4 text-sm text-muted">
                  {comp.location && <span>{comp.location}</span>}
                  <span>{formatDate(comp.event_date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {comp.registration_open && (
                  <span className="text-xs font-medium text-emerald-400">
                    Reg. open
                  </span>
                )}
                <StatusBadge status={comp.status} />
              </div>
            </Link>
          ))}
          </div>
        </div>
      </div>

      <ResetCompetitionsButton competitionCount={competitions?.length ?? 0} />
    </div>
  );
}
