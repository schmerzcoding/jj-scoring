import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null): string {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatScore(score: number): string {
  return score.toFixed(2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700",
    open: "bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-800/50",
    closed: "bg-amber-950/80 text-amber-300 ring-1 ring-amber-800/50",
    in_progress: "bg-sky-950/80 text-sky-300 ring-1 ring-sky-800/50",
    completed: "bg-brand-950/80 text-brand-300 ring-1 ring-brand-800/50",
    pending: "bg-amber-950/80 text-amber-300 ring-1 ring-amber-800/50",
    approved: "bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-800/50",
    rejected: "bg-red-950/80 text-red-300 ring-1 ring-red-800/50",
    active: "bg-sky-950/80 text-sky-300 ring-1 ring-sky-800/50",
  };
  return colors[status] ?? "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700";
}
