import Image from "next/image";
import { BRAND_ASSETS, HOME_HERO } from "@/lib/brand";
import { ButtonLink } from "@/components/ui/button";
import { HomeRoleCards } from "./home-role-cards";

export function HomeHero({ showSignup }: { showSignup: boolean }) {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__crystal" aria-hidden>
        <Image
          src={BRAND_ASSETS.homeCrystalIcon}
          alt=""
          width={1200}
          height={1200}
          className="home-hero__crystal-image"
          priority
        />
      </div>

      <div className="home-hero__top">
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">{HOME_HERO.eyebrow}</p>

          <div className="home-hero__title-wrap">
            <Image
              src={BRAND_ASSETS.homeTitleWaddle}
              alt="Waddle Social"
              width={1400}
              height={400}
              className="home-hero__title-image"
              id="home-hero-title"
              priority
            />
          </div>

          <p className="home-hero__description">
            {HOME_HERO.description}{" "}
            <strong className="font-semibold text-white">
              {HOME_HERO.descriptionHighlight}
            </strong>
          </p>
          <div className="home-hero__actions">
            <ButtonLink href="/competitions" size="lg">
              Browse Events
            </ButtonLink>
            {showSignup && (
              <ButtonLink href="/signup" variant="secondary" size="lg">
                Create Account
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      <div className="home-hero__roles">
        <HomeRoleCards />
      </div>
    </section>
  );
}
