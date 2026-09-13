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

export function formatTime(time: string | null): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  if (!hours || !minutes) return time;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventDateRange(
  startDate: string | null,
  endDate: string | null
): string {
  if (!startDate) return "TBD";
  if (!endDate || endDate === startDate) return formatDate(startDate);

  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const month = start.toLocaleDateString("en-US", { month: "long" });
    return `${month} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    const startPart = start.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
    const endPart = end.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return `${startPart} – ${endPart}`;
  }

  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function formatEventSchedule(
  startDate: string | null,
  startTime: string | null,
  endDate: string | null = null,
  endTime: string | null = null
): string {
  const startLabel = formatTime(startTime);
  const endLabel = formatTime(endTime);
  const multiDay = Boolean(
    startDate && endDate && endDate !== startDate
  );

  if (!startDate) {
    if (!startLabel && !endLabel) return "TBD";
    if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
    return startLabel || endLabel || "TBD";
  }

  if (multiDay) {
    if (startLabel && endLabel) {
      return `${formatDate(startDate)} · ${startLabel} – ${formatDate(endDate)} · ${endLabel}`;
    }
    return formatEventDateRange(startDate, endDate);
  }

  const dateLabel = formatDate(startDate);

  if (startLabel && endLabel) {
    return `${dateLabel} · ${startLabel} – ${endLabel}`;
  }
  if (startLabel) {
    return `${dateLabel} · ${startLabel}`;
  }
  return dateLabel;
}

export function formatScore(score: number): string {
  return score.toFixed(2);
}

export function formatEuro(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
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
    organizer: "bg-violet-950/80 text-violet-300 ring-1 ring-violet-800/50",
    social: "bg-fuchsia-950/80 text-fuchsia-300 ring-1 ring-fuchsia-800/50",
    workshop: "bg-cyan-950/80 text-cyan-300 ring-1 ring-cyan-800/50",
    masterclass: "bg-orange-950/80 text-orange-300 ring-1 ring-orange-800/50",
    congress: "bg-indigo-950/80 text-indigo-300 ring-1 ring-indigo-800/50",
    competition: "bg-brand-950/80 text-brand-300 ring-1 ring-brand-800/50",
    judge: "bg-indigo-950/80 text-indigo-300 ring-1 ring-indigo-800/50",
    admin: "bg-brand-950/80 text-brand-300 ring-1 ring-brand-800/50",
    participant: "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700",
  };
  return colors[status] ?? "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700";
}
