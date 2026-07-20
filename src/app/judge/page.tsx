import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function JudgeDashboard() {
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

  if (profile?.role !== "judge" && profile?.role !== "admin") redirect("/");

  const { data: assignments } = await supabase
    .from("competition_judges")
    .select("*, competition:competitions(*)")
    .eq("judge_id", user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Judge Panel</h1>
        <p className="mt-1 text-muted">
          Score participants in your assigned competitions.
        </p>
      </div>

      <div className="grid gap-4">
        {assignments?.length === 0 && (
          <p className="text-muted">
            You are not assigned to any competitions yet.
          </p>
        )}
        {assignments?.map((assignment) => {
          const comp = assignment.competition;
          if (!comp) return null;
          return (
            <Link
              key={assignment.id}
              href={`/judge/${comp.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20 transition-all hover:border-brand-800/40"
            >
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {comp.name}
                </h2>
                <div className="mt-1 flex gap-4 text-sm text-muted">
                  {comp.location && <span>{comp.location}</span>}
                  <span>{formatDate(comp.event_date)}</span>
                </div>
              </div>
              <StatusBadge status={comp.status} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
