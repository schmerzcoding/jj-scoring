import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  as: Tag = "span",
}: {
  className?: string;
  as?: "span" | "h1";
}) {
  return (
    <Tag className={cn(className)}>
      Waddle <span className="text-brand-500">Social</span>
    </Tag>
  );
}
