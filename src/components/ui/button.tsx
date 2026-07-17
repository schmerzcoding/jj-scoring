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
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50",
        {
          "bg-brand-600 text-white hover:bg-brand-700": variant === "primary",
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50":
            variant === "secondary",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900":
            variant === "ghost",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
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
