import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand";

const LOGO_MARK_WIDTH = 769;
const LOGO_MARK_HEIGHT = 695;

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm" ? "h-7 w-auto" : size === "lg" ? "h-10 w-auto" : "h-8 w-auto";

  return (
    <Image
      src={BRAND_ASSETS.logoMark}
      alt={BRAND_NAME}
      width={LOGO_MARK_WIDTH}
      height={LOGO_MARK_HEIGHT}
      className={cn("inline-block shrink-0", sizeClass, className)}
    />
  );
}
