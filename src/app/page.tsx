import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { getPostLoginPath, isEmailVerified, needsProfileSetup } from "@/lib/auth";

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
    if (!isEmailVerified(user)) {
      redirect("/verify-email");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (needsProfileSetup(profile)) {
      redirect("/profile/setup");
    }

    redirect(getPostLoginPath(profile));
  }

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Jack <span className="text-brand-500">&</span> Jill Scoring
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Manage competitions, register as leader or follower, and score
          participants round by round — all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/competitions"
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-brand-950/40 transition-all hover:bg-brand-500"
          >
            Browse Competitions
          </Link>
          {!user && (
            <Link
              href="/signup"
              className="rounded-xl border border-border bg-surface-overlay px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-brand-700/50 hover:bg-surface-hover"
            >
              Create Account
            </Link>
          )}
        </div>
      </section>

      {competitions && competitions.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            Upcoming Competitions
          </h2>
          <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {competitions.map((comp) => (
              <Link
                key={comp.id}
                href={`/competitions/${comp.id}`}
                className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20 transition-all hover:border-brand-800/40 hover:shadow-brand-950/10"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-foreground">{comp.name}</h3>
                  <StatusBadge status={comp.status} />
                </div>
                {comp.location && (
                  <p className="mt-2 text-sm text-muted">{comp.location}</p>
                )}
                <p className="mt-1 text-sm text-muted">
                  {formatDate(comp.event_date)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="stagger-children grid gap-8 sm:grid-cols-3">
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
    <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}
