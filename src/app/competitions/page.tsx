import { createClient } from "@/lib/supabase/server";
import { CompetitionList } from "@/components/competition-list";
import { SANDBOX_COMPETITION_NAME_PREFIX } from "@/lib/competition-access";

export default async function CompetitionsPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("competitions")
    .select("*")
    .in("status", ["open", "closed", "in_progress", "completed"])
    .order("event_date", { ascending: true });

  const competitions =
    rows?.filter((c) => !c.name.startsWith(SANDBOX_COMPETITION_NAME_PREFIX)) ?? [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground">Events</h1>
      <p className="mt-2 text-muted">
        Browse dance events in Dublin and beyond — socials, workshops, congresses, and competitions.
      </p>

      <div className="mt-8">
        <CompetitionList competitions={competitions ?? []} />
      </div>
    </div>
  );
}
