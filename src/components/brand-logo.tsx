import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";

export function BrandLogo({
  className,
  as: Tag = "span",
}: {
  className?: string;
  as?: "span" | "h1";
}) {
  return (
    <Tag className={cn("inline-flex items-center", className)}>
      <span className="sm:hidden">
        <BrandMark size="md" />
      </span>
      <span className="hidden sm:inline">
        Waddle <span className="text-brand-500">Social</span>
      </span>
    </Tag>
  );
}
