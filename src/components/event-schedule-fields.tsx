import { Input } from "@/components/ui/input";

export function EventScheduleFields({
  eventDate,
  startTime,
  endTime,
  onEventDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: {
  eventDate: string;
  startTime: string;
  endTime: string;
  onEventDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Event date"
        type="date"
        value={eventDate}
        onChange={(e) => onEventDateChange(e.target.value)}
      />
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
