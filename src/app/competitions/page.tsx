import { createClient } from "@/lib/supabase/server";
import { CompetitionList } from "@/components/competition-list";

export default async function CompetitionsPage() {
  const supabase = await createClient();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .in("status", ["open", "closed", "in_progress", "completed"])
    .order("event_date", { ascending: true });

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground">Competitions</h1>
      <p className="mt-2 text-muted">
        Browse open and upcoming Jack & Jill events.
      </p>

      <div className="mt-8">
        <CompetitionList competitions={competitions ?? []} />
      </div>
    </div>
  );
}
