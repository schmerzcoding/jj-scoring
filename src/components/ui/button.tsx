import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(
    "ui-btn inline-flex items-center justify-center font-medium",
    "disabled:pointer-events-none disabled:opacity-45",
    {
      "ui-btn--primary": variant === "primary",
      "ui-btn--secondary": variant === "secondary",
      "rounded-full border border-red-900/60 bg-red-900/80 text-red-100 shadow-md shadow-red-950/30 hover:bg-red-800 active:scale-[0.98]":
        variant === "danger",
      "rounded-full bg-emerald-900/80 text-emerald-100 shadow-md shadow-emerald-950/30":
        variant === "success",
      "rounded-full text-muted-foreground hover:bg-surface-hover hover:text-foreground":
        variant === "ghost",
      "px-4 py-1.5 text-sm": size === "sm",
      "px-5 py-2.5 text-sm": size === "md",
      "px-7 py-3 text-base": size === "lg",
    },
    className
  );
}

export function ButtonSecondaryFrost() {
  return <span className="ui-btn__frost" aria-hidden="true" />;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {variant === "secondary" && <ButtonSecondaryFrost />}
      <span className="ui-btn__content">
        {loading && (
          <Spinner size={size === "sm" ? "sm" : "md"} className="mr-2 shrink-0" />
        )}
        {children}
      </span>
    </button>
  );
}
