export function isMultiDayEvent(
  startDate: string | null,
  endDate: string | null
): boolean {
  return Boolean(startDate && endDate && endDate !== startDate);
}

export function effectiveEventEndDate(
  startDate: string | null,
  endDate: string | null
): string | null {
  if (!startDate) return endDate;
  return endDate && endDate !== startDate ? endDate : startDate;
}

export function resolveStoredEventEndDate(
  startDate: string,
  endDate: string
): string | null {
  if (!startDate) return null;
  if (!endDate || endDate === startDate) return null;
  return endDate;
}

export function validateEventSchedule({
  startDate = "",
  endDate = "",
  startTime = "",
  endTime = "",
}: {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}): string | null {
  const effectiveEndDate = endDate || startDate;

  if (startDate && effectiveEndDate && effectiveEndDate < startDate) {
    return "End date must be on or after start date.";
  }

  const sameDay =
    !startDate || !effectiveEndDate || effectiveEndDate === startDate;

  if (sameDay && startTime && endTime && endTime <= startTime) {
    return "For overnight events, set the end date to the next day.";
  }

  return null;
}

export function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function toTimeInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}
