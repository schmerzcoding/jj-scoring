import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand";

/** Intrinsic size of logo-horizontal.png — keeps aspect ratio correct */
const LOGO_H_WIDTH = 909;
const LOGO_H_HEIGHT = 129;

/** Intrinsic size of logo-mark.png */
const LOGO_MARK_WIDTH = 769;
const LOGO_MARK_HEIGHT = 695;

export function BrandLogo({
  className,
  variant = "nav",
}: {
  className?: string;
  variant?: "nav" | "hero";
}) {
  const mobileMark = (
    <Image
      src={BRAND_ASSETS.logoMark}
      alt={BRAND_NAME}
      width={LOGO_MARK_WIDTH}
      height={LOGO_MARK_HEIGHT}
      priority
      className={cn(
        "block w-auto sm:hidden",
        variant === "nav" ? "h-12" : "h-24"
      )}
    />
  );

  if (variant === "hero") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Image
          src={BRAND_ASSETS.logoHorizontal}
          alt={BRAND_NAME}
          width={LOGO_H_WIDTH}
          height={LOGO_H_HEIGHT}
          priority
          className="hidden h-auto w-full max-w-2xl sm:block"
        />
        {mobileMark}
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      {mobileMark}
      <Image
        src={BRAND_ASSETS.logoHorizontal}
        alt={BRAND_NAME}
        width={LOGO_H_WIDTH}
        height={LOGO_H_HEIGHT}
        priority
        className="hidden h-[5rem] w-auto sm:block md:h-[5.25rem] lg:h-[5.5rem]"
      />
    </span>
  );
}
