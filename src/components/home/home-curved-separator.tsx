import Image from "next/image";
import { BRAND_ASSETS } from "@/lib/brand";

type HomeCurvedSeparatorProps = {
  className?: string;
};

export function HomeCurvedSeparator({ className = "" }: HomeCurvedSeparatorProps) {
  return (
    <div className={`home-curved-separator ${className}`.trim()} aria-hidden>
      <Image
        src={BRAND_ASSETS.homeSeparator}
        alt=""
        width={2701}
        height={309}
        className="home-curved-separator__image"
        priority
      />
    </div>
  );
}
