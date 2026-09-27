import Image from "next/image";
import { BRAND_ASSETS, WADDLE_CUP_LANDING } from "@/lib/brand";
import { ButtonLink } from "@/components/ui/button";
import { WaddleCupCtaActions } from "@/components/waddle-cup/waddle-cup-cta-actions";
import type { WaddleCupEvents } from "@/lib/waddle-cup";

export function WaddleCupLanding({ events }: { events: WaddleCupEvents }) {
  const hasAnyEvent = Boolean(events.congress || events.competition);
  return (
    <div className="waddle-cup-page">
      <section className="waddle-cup-page__hero" aria-labelledby="waddle-cup-title">
        <div className="waddle-cup-page__hero-copy">
          <div className="waddle-cup-page__title-wrap">
            <Image
              src={BRAND_ASSETS.homeWaddleCupTitle}
              alt="The Waddle Cup"
              width={1200}
              height={425}
              className="waddle-cup-page__title-image"
              id="waddle-cup-title"
              priority
            />
          </div>
          <p className="waddle-cup-page__eyebrow">{WADDLE_CUP_LANDING.eyebrow}</p>
          <p className="waddle-cup-page__intro">{WADDLE_CUP_LANDING.intro}</p>
          <div className="waddle-cup-page__meta">
            <p className="waddle-cup-page__meta-line">{WADDLE_CUP_LANDING.heroDate}</p>
            <p className="waddle-cup-page__meta-line">
              <strong className="font-semibold text-white">
                {WADDLE_CUP_LANDING.heroLocationHighlight}
              </strong>
              {WADDLE_CUP_LANDING.heroLocationSuffix}
            </p>
          </div>
          <div className="waddle-cup-page__hero-actions">
            {hasAnyEvent ? (
              <>
                <ButtonLink href="#ready-to-join" size="lg">
                  {WADDLE_CUP_LANDING.ctaPrimary}
                </ButtonLink>
                <ButtonLink href="/competitions" size="lg" variant="secondary">
                  {WADDLE_CUP_LANDING.ctaSecondary}
                </ButtonLink>
              </>
            ) : (
              <ButtonLink href="/competitions" size="lg">
                {WADDLE_CUP_LANDING.ctaSecondary}
              </ButtonLink>
            )}
          </div>
        </div>

        <div className="waddle-cup-page__hero-visual" aria-hidden>
          <Image
            src={BRAND_ASSETS.waddleCupTrophy}
            alt=""
            width={900}
            height={900}
            className="waddle-cup-page__trophy-image"
            priority
            unoptimized
          />
        </div>
      </section>

      <section className="waddle-cup-page__pillars" aria-labelledby="waddle-cup-pillars-heading">
        <h2 id="waddle-cup-pillars-heading" className="waddle-cup-page__section-title">
          The day in three parts
        </h2>
        <div className="waddle-cup-page__pillar-grid">
          {WADDLE_CUP_LANDING.pillars.map((pillar) => (
            <article key={pillar.title} className="waddle-cup-page__pillar-card">
              <h3 className="waddle-cup-page__pillar-title">{pillar.title}</h3>
              <p className="waddle-cup-page__pillar-copy">{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="waddle-cup-page__format" aria-labelledby="waddle-cup-format-heading">
        <h2 id="waddle-cup-format-heading" className="waddle-cup-page__section-title">
          {WADDLE_CUP_LANDING.formatTitle}
        </h2>
        <div className="waddle-cup-page__format-grid">
          {WADDLE_CUP_LANDING.formatSections.map((section, index) => (
            <article key={section.title} className="waddle-cup-page__format-step">
              <span className="waddle-cup-page__format-index">{index + 1}</span>
              <div>
                <h3 className="waddle-cup-page__format-title">{section.title}</h3>
                <p className="waddle-cup-page__format-copy">{section.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="ready-to-join"
        className="waddle-cup-page__cta"
        aria-labelledby="waddle-cup-cta-heading"
      >
        <div className="waddle-cup-page__cta-card">
          <h2 id="waddle-cup-cta-heading" className="waddle-cup-page__cta-title">
            Ready to join?
          </h2>
          <p className="waddle-cup-page__cta-copy">
            {hasAnyEvent
              ? WADDLE_CUP_LANDING.ctaEventCopy
              : WADDLE_CUP_LANDING.ctaNoEventCopy}
          </p>
          <WaddleCupCtaActions events={events} />
        </div>
      </section>
    </div>
  );
}
