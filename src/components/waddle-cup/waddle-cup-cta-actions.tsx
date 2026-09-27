import { WADDLE_CUP_LANDING } from "@/lib/brand";
import { ButtonLink } from "@/components/ui/button";
import { waddleCupEventPath } from "@/lib/waddle-cup";
import type { WaddleCupEvents } from "@/lib/waddle-cup";

export function WaddleCupCtaActions({ events }: { events: WaddleCupEvents }) {
  const { congress, competition } = events;
  const hasAnyEvent = Boolean(congress || competition);

  if (!hasAnyEvent) {
    return (
      <div className="waddle-cup-page__cta-actions">
        <ButtonLink href="/competitions" size="lg">
          {WADDLE_CUP_LANDING.ctaSecondary}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="waddle-cup-page__cta-actions waddle-cup-page__cta-actions--dual">
      {congress && (
        <ButtonLink href={waddleCupEventPath(congress.id)} size="lg">
          {WADDLE_CUP_LANDING.ctaPass}
        </ButtonLink>
      )}
      {competition && (
        <ButtonLink
          href={waddleCupEventPath(competition.id)}
          size="lg"
          variant="primary"
          className="waddle-cup-page__cta-btn-jj"
        >
          {WADDLE_CUP_LANDING.ctaCompetition}
        </ButtonLink>
      )}
    </div>
  );
}
