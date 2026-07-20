import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
        "disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        {
          "bg-brand-600 text-white shadow-md shadow-brand-950/40 hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-900/35 active:scale-[0.98]":
            variant === "primary",
          "border border-border bg-surface-overlay text-foreground hover:border-brand-700/50 hover:bg-surface-hover":
            variant === "secondary",
          "bg-red-900/80 text-red-100 shadow-md shadow-red-950/30 hover:bg-red-800 active:scale-[0.98]":
            variant === "danger",
          "text-muted-foreground hover:bg-surface-hover hover:text-foreground":
            variant === "ghost",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2.5 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
