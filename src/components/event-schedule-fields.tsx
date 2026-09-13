import { Input } from "@/components/ui/input";

export function EventScheduleFields({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
        />
        <Input
          label="End date"
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => onEndDateChange(e.target.value)}
          placeholder="Same day if blank"
        />
      </div>
      <p className="text-xs text-muted">
        For multi-day events, set both dates. For overnight events (e.g. Friday
        21:00 – Saturday 02:00), use the next day as the end date.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start time"
          type="time"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
        />
        <Input
          label="End time"
          type="time"
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
}
