import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { EventTypeBadge } from "@/components/event-type-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function OrganizerDashboard() {
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

  if (profile?.role !== "organizer" && profile?.role !== "admin") redirect("/");

  const { data: events } = await supabase
    .from("competitions")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organizer Dashboard</h1>
          <p className="mt-1 text-muted">
            Create and manage dance events — socials, workshops, congresses, and more.
          </p>
        </div>
        <Link href="/organizer/events/new">
          <Button>Create event</Button>
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground">Your events</h2>
        <div className="mt-4 grid gap-4">
          {events?.length === 0 && (
            <EmptyState
              icon="calendar"
              title="No events yet"
              description="Create your first social, workshop, congress, or competition."
              action={
                <Link href="/organizer/events/new">
                  <Button>Create event</Button>
                </Link>
              }
            />
          )}
          <div className="stagger-children grid gap-4">
            {events?.map((event) => (
              <Link
                key={event.id}
                href={`/organizer/events/${event.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20 transition-all hover:border-brand-800/40"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{event.name}</h3>
                    <EventTypeBadge type={event.event_type ?? "competition"} />
                  </div>
                  <div className="mt-1 flex gap-4 text-sm text-muted">
                    {event.location && <span>{event.location}</span>}
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                </div>
                <StatusBadge status={event.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
