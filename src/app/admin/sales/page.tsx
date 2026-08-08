import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EventSalesGrid } from "@/components/event-sales-grid";
import { SalesSummaryBar } from "@/components/sales-summary-bar";
import { fetchEventsWithSales } from "@/lib/event-sales-server";
import { sumSalesStats } from "@/lib/event-sales";

export default async function AdminSalesPage() {
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

  const events = await fetchEventsWithSales(supabase);
  const totals = sumSalesStats(events);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Ticket sales</h1>
        <p className="mt-1 text-muted">
          Overview of ticket sales and revenue for every event on the platform.
        </p>
      </div>

      <SalesSummaryBar totals={totals} />

      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">All events</h2>
        <EventSalesGrid
          events={events}
          manageBasePath="/admin/competitions"
          emptyDescription="No events have been created yet."
        />
      </section>
    </div>
  );
}
