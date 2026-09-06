import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand";

/** Intrinsic size of logo-horizontal.png — keeps aspect ratio correct */
const LOGO_H_WIDTH = 909;
const LOGO_H_HEIGHT = 129;

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={BRAND_ASSETS.logoHorizontal}
        alt={BRAND_NAME}
        width={LOGO_H_WIDTH}
        height={LOGO_H_HEIGHT}
        priority
        className="h-12 w-auto sm:h-[5rem] md:h-[5.25rem] lg:h-[5.5rem]"
      />
    </span>
  );
}
