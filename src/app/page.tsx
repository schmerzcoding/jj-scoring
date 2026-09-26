import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { HomeCurvedSeparator } from "@/components/home/home-curved-separator";
import { HomeHero } from "@/components/home/home-hero";
import { HomeSectionFrame } from "@/components/home/home-section-frame";
import { HomeWaddleCupFeature } from "@/components/home/home-waddle-cup-feature";
import { formatEventDateRange } from "@/lib/utils";
import { fetchWaddleCupEvent, isWaddleCupPromoVisible } from "@/lib/waddle-cup";
import { isEmailVerified, requireEmailVerification } from "@/lib/auth";

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

  const showWaddleCupPromo = isWaddleCupPromoVisible();
  const upcomingClassName =
    showWaddleCupPromo && waddleCupEvent
      ? "home-upcoming"
      : "home-upcoming home-upcoming--solo";

  return (
    <div className="home-page">
      <HomeHero showSignup={!user} />

      <div className="home-feature-stack">
        <HomeCurvedSeparator />

        {showWaddleCupPromo && (
          <div className="home-feature-row">
            <HomeWaddleCupFeature />
          </div>
        )}

        <div className="home-feature-row">
          <HomeSectionFrame className={upcomingClassName} glass>
            <section aria-labelledby="home-upcoming-heading">
              <h2 id="home-upcoming-heading" className="home-upcoming__heading">
                Upcoming Events
              </h2>
              {upcomingEvents.length > 0 ? (
                <div className="stagger-children home-upcoming__grid">
                  {upcomingEvents.map((comp) => (
                    <Link
                      key={comp.id}
                      href={`/competitions/${comp.id}`}
                      className="home-upcoming__card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-foreground">
                          {comp.name}
                        </h3>
                        <StatusBadge status={comp.status} />
                      </div>
                      {comp.location && (
                        <p className="mt-2 text-sm text-muted">
                          {comp.location}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-muted">
                        {formatEventDateRange(
                          comp.event_date,
                          comp.event_end_date
                        )}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="home-upcoming__empty">
                  New events from organizers will show up here soon.
                </p>
              )}
            </section>
          </HomeSectionFrame>
        </div>
      </div>
    </div>
  );
}
