import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { WaddleCupPromoBanner } from "@/components/waddle-cup-promo-banner";
import { formatEventDateRange } from "@/lib/utils";
import { fetchWaddleCupEvent } from "@/lib/waddle-cup";
import { isEmailVerified, requireEmailVerification } from "@/lib/auth";
import { ButtonSecondaryFrost, buttonClassName } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && requireEmailVerification() && !isEmailVerified(user)) {
    redirect("/verify-email");
  }

  const [waddleCupEvent, { data: competitions }] = await Promise.all([
    fetchWaddleCupEvent(supabase),
    supabase
      .from("competitions")
      .select("*")
      .in("status", ["open", "in_progress"])
      .order("event_date", { ascending: true })
      .limit(6),
  ]);

  const upcomingEvents =
    competitions?.filter((comp) => comp.id !== waddleCupEvent?.id).slice(0, 3) ??
    [];

  return (
    <div className="space-y-10 pt-10 sm:space-y-12 sm:pt-14">
      <section className="text-center">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl">
          {BRAND_NAME}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted sm:mt-4 sm:text-lg">
          Discover dance events in Dublin and beyond — socials, workshops,
          masterclasses, congresses, and competitions — all in one place.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 sm:mt-8 sm:gap-4">
          <Link
            href="/competitions"
            className={buttonClassName("primary", "lg")}
          >
            <span className="ui-btn__content">Browse Events</span>
          </Link>
          {!user && (
            <Link href="/signup" className={buttonClassName("secondary", "lg")}>
              <ButtonSecondaryFrost />
              <span className="ui-btn__content">Create Account</span>
            </Link>
          )}
        </div>
      </section>

      {waddleCupEvent && (
        <section>
          <WaddleCupPromoBanner event={waddleCupEvent} />
        </section>
      )}

      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground sm:mb-6 sm:text-2xl">
            Upcoming Events
          </h2>
          <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((comp) => (
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
                  {formatEventDateRange(comp.event_date, comp.event_end_date)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="stagger-children grid gap-8 sm:grid-cols-3">
        <FeatureCard
          title="For Organizers"
          description="Create events, manage registrations, assign judges, and run competitions."
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
    <div className="glass-feature-card" tabIndex={0}>
      <div className="glass-feature-card__flares" aria-hidden>
        <span className="glass-feature-card__flare glass-feature-card__flare--top" />
        <span className="glass-feature-card__flare glass-feature-card__flare--right" />
        <span className="glass-feature-card__flare glass-feature-card__flare--bottom" />
      </div>
      <div className="glass-feature-card__surface">
        <h3 className="glass-feature-card__title">{title}</h3>
        <p className="glass-feature-card__description">{description}</p>
      </div>
    </div>
  );
}
