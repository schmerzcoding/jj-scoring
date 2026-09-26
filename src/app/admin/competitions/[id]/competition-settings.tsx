"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isCompetitionEvent, supportsMultiTicketTypes } from "@/lib/events";
import {
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
  const usesTicketTypeCatalog = supportsMultiTicketTypes(competition.event_type);
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

    const ticketPriceCents = usesTicketTypeCatalog
      ? competition.ticket_price_cents
      : isCompetition
        ? null
        : parseEuroInputToCents(ticketPriceEuro);
    const leaderPriceCents = usesTicketTypeCatalog
      ? competition.leader_price_cents
      : isCompetition
        ? parseEuroInputToCents(leaderPriceEuro)
        : null;
    const followerPriceCents = usesTicketTypeCatalog
      ? competition.follower_price_cents
      : isCompetition
        ? parseEuroInputToCents(followerPriceEuro)
        : null;

    const supabase = createClient();
    const updatePayload: {
      status: CompetitionStatus;
      registration_open: boolean;
      ticket_price_cents?: number | null;
      leader_price_cents?: number | null;
      follower_price_cents?: number | null;
    } = {
      status,
      registration_open: registrationOpen,
    };

    if (!usesTicketTypeCatalog) {
      updatePayload.ticket_price_cents = ticketPriceCents;
      updatePayload.leader_price_cents = leaderPriceCents;
      updatePayload.follower_price_cents = followerPriceCents;
    }

    const { error: updateError } = await fromTable(supabase, "competitions")
      .update(updatePayload)
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
    <Card title="Settings">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CompetitionStatus)}
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
        <p className="text-xs text-muted">
          Controls ticket sales and competition sign-ups independently from event status.
        </p>

        {!usesTicketTypeCatalog && (
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
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button onClick={() => void handleSave()} loading={loading} size="sm">
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </Card>
  );
}
