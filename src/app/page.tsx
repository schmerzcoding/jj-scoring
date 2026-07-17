import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .in("status", ["open", "in_progress"])
    .order("event_date", { ascending: true })
    .limit(3);

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") redirect("/admin");
    if (profile?.role === "judge") redirect("/judge");
  }

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Jack & Jill Scoring
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Manage competitions, register as leader or follower, and score
          participants round by round — all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/competitions"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Browse Competitions
          </Link>
          {!user && (
            <Link
              href="/signup"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Create Account
            </Link>
          )}
        </div>
      </section>

      {competitions && competitions.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Upcoming Competitions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {competitions.map((comp) => (
              <Link
                key={comp.id}
                href={`/competitions/${comp.id}`}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                  <StatusBadge status={comp.status} />
                </div>
                {comp.location && (
                  <p className="mt-2 text-sm text-gray-500">{comp.location}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(comp.event_date)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-8 sm:grid-cols-3">
        <FeatureCard
          title="For Organizers"
          description="Create events, manage rounds, approve registrations, and assign judges."
        />
        <FeatureCard
          title="For Judges"
          description="Score participants individually, round by round, from any device."
        />
        <FeatureCard
          title="For Dancers"
          description="Register as leader or follower and track your competition status."
        />
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
