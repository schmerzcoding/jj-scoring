"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isCompetitionEvent } from "@/lib/events";
import {
  eventHasPaidTickets,
  formatCentsToEuroInput,
  parseEuroInputToCents,
} from "@/lib/ticket-pricing";
import type { Competition, CompetitionStatus } from "@/types/database";

export function CompetitionSettings({
  competition,
}: {
  competition: Competition;
}) {
  const router = useRouter();
  const isCompetition = isCompetitionEvent(competition.event_type);
  const [status, setStatus] = useState<CompetitionStatus>(competition.status);
  const [registrationOpen, setRegistrationOpen] = useState(
    competition.registration_open
  );
  const [ticketPriceEuro, setTicketPriceEuro] = useState(
    formatCentsToEuroInput(competition.ticket_price_cents)
  );
  const [leaderPriceEuro, setLeaderPriceEuro] = useState(
    formatCentsToEuroInput(competition.leader_price_cents)
  );
  const [followerPriceEuro, setFollowerPriceEuro] = useState(
    formatCentsToEuroInput(competition.follower_price_cents)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setLoading(true);
    setError("");

    const ticketPriceCents = isCompetition
      ? null
      : parseEuroInputToCents(ticketPriceEuro);
    const leaderPriceCents = isCompetition
      ? parseEuroInputToCents(leaderPriceEuro)
      : null;
    const followerPriceCents = isCompetition
      ? parseEuroInputToCents(followerPriceEuro)
      : null;

    const hasPaidTickets = eventHasPaidTickets({
      event_type: competition.event_type,
      ticket_price_cents: ticketPriceCents,
      leader_price_cents: leaderPriceCents,
      follower_price_cents: followerPriceCents,
    });

    const supabase = createClient();
    const { error: updateError } = await fromTable(supabase, "competitions")
      .update({
        status,
        registration_open: registrationOpen || hasPaidTickets,
        ticket_price_cents: ticketPriceCents,
        leader_price_cents: leaderPriceCents,
        follower_price_cents: followerPriceCents,
      })
      .eq("id", competition.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    if (hasPaidTickets && !registrationOpen) {
      setRegistrationOpen(true);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <Card title="Settings">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              const nextStatus = e.target.value as CompetitionStatus;
              setStatus(nextStatus);
              if (nextStatus === "open") {
                setRegistrationOpen(true);
              }
            }}
            options={[
              { value: "draft", label: "Draft" },
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <label className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={registrationOpen}
              onChange={(e) => setRegistrationOpen(e.target.checked)}
              className="rounded border-border bg-surface-raised text-brand-500 focus:ring-brand-600/30"
            />
            <span className="text-sm text-foreground">Registration open</span>
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface-raised/60 p-4">
          <p className="text-sm font-medium text-foreground">Ticket prices (EUR)</p>
          <p className="text-xs text-muted">
            Set a price to enable Stripe ticket sales on the public event page.
          </p>
          {isCompetition ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Leader pass (€)"
                type="number"
                min="0"
                step="0.01"
                value={leaderPriceEuro}
                onChange={(e) => setLeaderPriceEuro(e.target.value)}
                placeholder="25.00"
              />
              <Input
                label="Follower pass (€)"
                type="number"
                min="0"
                step="0.01"
                value={followerPriceEuro}
                onChange={(e) => setFollowerPriceEuro(e.target.value)}
                placeholder="25.00"
              />
            </div>
          ) : (
            <Input
              label="Ticket price (€)"
              type="number"
              min="0"
              step="0.01"
              value={ticketPriceEuro}
              onChange={(e) => setTicketPriceEuro(e.target.value)}
              placeholder="15.00"
            />
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button onClick={() => void handleSave()} loading={loading} size="sm">
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </Card>
  );
}
