"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventScheduleFields } from "@/components/event-schedule-fields";
import {
  resolveStoredEventEndDate,
  toDateInputValue,
  toTimeInputValue,
  validateEventSchedule,
} from "@/lib/event-schedule";
import type { Competition } from "@/types/database";

export function CompetitionScheduleSettings({
  competition,
}: {
  competition: Competition;
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(
    toDateInputValue(competition.event_date)
  );
  const [endDate, setEndDate] = useState(
    toDateInputValue(competition.event_end_date)
  );
  const [startTime, setStartTime] = useState(
    toTimeInputValue(competition.start_time)
  );
  const [endTime, setEndTime] = useState(toTimeInputValue(competition.end_time));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const scheduleError = validateEventSchedule({
      startDate,
      endDate: endDate || startDate,
      startTime,
      endTime,
    });

    if (scheduleError) {
      setError(scheduleError);
      return;
    }

    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await fromTable(supabase, "competitions")
      .update({
        event_date: startDate || null,
        event_end_date: startDate
          ? resolveStoredEventEndDate(startDate, endDate || startDate)
          : null,
        start_time: startTime || null,
        end_time: endTime || null,
      })
      .eq("id", competition.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <Card title="Schedule">
      <div className="space-y-4">
        <EventScheduleFields
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button onClick={() => void handleSave()} loading={loading} size="sm">
          {loading ? "Saving..." : "Save schedule"}
        </Button>
      </div>
    </Card>
  );
}
