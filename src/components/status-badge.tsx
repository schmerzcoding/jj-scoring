import { cn, getStatusColor } from "@/lib/utils";

interface BadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors duration-200",
        getStatusColor(status),
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
