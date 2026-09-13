import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand";

/** Intrinsic size of logo-horizontal-white.png — keeps aspect ratio correct */
const LOGO_H_WIDTH = 4800;
const LOGO_H_HEIGHT = 1640;

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={BRAND_ASSETS.logoHorizontalWhite}
        alt={BRAND_NAME}
        width={LOGO_H_WIDTH}
        height={LOGO_H_HEIGHT}
        priority
        className="h-8 w-auto sm:h-9 md:h-10"
      />
    </span>
  );
}
