import { cn } from "@/lib/utils";

const BRAND_MARK_COLORS = {
  background: "#121216",
  w: "#f4f4f6",
  s: "#d43d62",
} as const;

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("inline-block shrink-0", sizeClass, className)}
    >
      <rect width="32" height="32" rx="8" fill={BRAND_MARK_COLORS.background} />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="15"
        fontWeight="700"
        letterSpacing="-0.5"
      >
        <tspan fill={BRAND_MARK_COLORS.w}>W</tspan>
        <tspan fill={BRAND_MARK_COLORS.s}>S</tspan>
      </text>
    </svg>
  );
}
