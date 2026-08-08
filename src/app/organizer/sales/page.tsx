import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventSalesGrid } from "@/components/event-sales-grid";
import { SalesSummaryBar } from "@/components/sales-summary-bar";
import { fetchEventsWithSales } from "@/lib/event-sales-server";
import { sumSalesStats } from "@/lib/event-sales";

export default async function OrganizerSalesPage() {
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

  const events = await fetchEventsWithSales(supabase, { createdBy: user.id });
  const totals = sumSalesStats(events);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/organizer"
            className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
          >
            &larr; Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Ticket sales</h1>
          <p className="mt-1 text-muted">
            Track tickets sold and revenue across all your events in one place.
          </p>
        </div>
        <Link href="/organizer/events/new">
          <Button>Create event</Button>
        </Link>
      </div>

      <SalesSummaryBar totals={totals} />

      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Your events</h2>
        <EventSalesGrid
          events={events}
          manageBasePath="/organizer/events"
          emptyDescription="Create an event to start tracking ticket sales here."
        />
      </section>
    </div>
  );
}
