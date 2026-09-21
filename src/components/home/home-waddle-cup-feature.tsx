import Image from "next/image";
import Link from "next/link";
import {
  BRAND_ASSETS,
  HOME_FEATURE_EVENT,
} from "@/lib/brand";
import { waddleCupEventPath } from "@/lib/waddle-cup";
import type { Competition } from "@/types/database";

export function HomeWaddleCupFeature({ event }: { event: Competition }) {
  return (
    <section className="home-waddle-cup" aria-labelledby="home-waddle-cup-heading">
      <Link
        href={waddleCupEventPath(event.id)}
        className="home-waddle-cup__link group"
      >
        <div className="home-waddle-cup__trophy" aria-hidden>
          <Image
            src={BRAND_ASSETS.homeTrophyShadow}
            alt=""
            width={900}
            height={900}
            className="home-waddle-cup__trophy-image"
            priority
          />
        </div>

        <div className="home-waddle-cup__copy">
          <p className="home-waddle-cup__eyebrow">{HOME_FEATURE_EVENT.eyebrow}</p>
          <div className="home-waddle-cup__title-wrap">
            <Image
              src={BRAND_ASSETS.homeWaddleCupTitle}
              alt="The Waddle Cup"
              width={1200}
              height={425}
              className="home-waddle-cup__title-image"
              id="home-waddle-cup-heading"
              priority
            />
          </div>
          <div className="home-waddle-cup__details">
            <p className="home-waddle-cup__details-line">
              <strong className="font-semibold text-white">
                {HOME_FEATURE_EVENT.tagline}
              </strong>
            </p>
            <p className="home-waddle-cup__details-line">
              {HOME_FEATURE_EVENT.dateLocationPrefix}
              <strong className="font-semibold text-white">
                {HOME_FEATURE_EVENT.dateLocationHighlight}
              </strong>
              {HOME_FEATURE_EVENT.dateLocationSuffix}
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
