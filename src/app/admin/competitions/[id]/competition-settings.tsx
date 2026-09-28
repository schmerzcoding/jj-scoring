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
  formatPriceLabelWithBuyerFee,
  parseEuroInputToCents,
} from "@/lib/ticket-pricing";
import { PassFeesToBuyerField } from "@/components/pass-fees-to-buyer-field";
import {
  DEFAULT_APPROVAL_EMAIL_BODY,
  DEFAULT_APPROVAL_EMAIL_SUBJECT,
  DEFAULT_REJECTION_EMAIL_BODY,
  DEFAULT_REJECTION_EMAIL_SUBJECT,
  REGISTRATION_EMAIL_PLACEHOLDERS,
} from "@/lib/email/registration-email-templates";
import { cn } from "@/lib/utils";
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
  const [passFeesToBuyer, setPassFeesToBuyer] = useState(
    competition.pass_fees_to_buyer ?? false
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
  const [approvalEmailSubject, setApprovalEmailSubject] = useState(
    competition.registration_approval_email_subject ?? DEFAULT_APPROVAL_EMAIL_SUBJECT
  );
  const [approvalEmailBody, setApprovalEmailBody] = useState(
    competition.registration_approval_email_body ?? DEFAULT_APPROVAL_EMAIL_BODY
  );
  const [rejectionEmailSubject, setRejectionEmailSubject] = useState(
    competition.registration_rejection_email_subject ?? DEFAULT_REJECTION_EMAIL_SUBJECT
  );
  const [rejectionEmailBody, setRejectionEmailBody] = useState(
    competition.registration_rejection_email_body ?? DEFAULT_REJECTION_EMAIL_BODY
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function normalizeEmailTemplate(value: string, fallback: string): string | null {
    const trimmed = value.trim();
    if (!trimmed || trimmed === fallback.trim()) return null;
    return trimmed;
  }

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
      pass_fees_to_buyer: boolean;
      ticket_price_cents?: number | null;
      leader_price_cents?: number | null;
      follower_price_cents?: number | null;
      registration_approval_email_subject?: string | null;
      registration_approval_email_body?: string | null;
      registration_rejection_email_subject?: string | null;
      registration_rejection_email_body?: string | null;
    } = {
      status,
      registration_open: registrationOpen,
      pass_fees_to_buyer: passFeesToBuyer,
    };

    if (isCompetition) {
      updatePayload.registration_approval_email_subject = normalizeEmailTemplate(
        approvalEmailSubject,
        DEFAULT_APPROVAL_EMAIL_SUBJECT
      );
      updatePayload.registration_approval_email_body = normalizeEmailTemplate(
        approvalEmailBody,
        DEFAULT_APPROVAL_EMAIL_BODY
      );
      updatePayload.registration_rejection_email_subject = normalizeEmailTemplate(
        rejectionEmailSubject,
        DEFAULT_REJECTION_EMAIL_SUBJECT
      );
      updatePayload.registration_rejection_email_body = normalizeEmailTemplate(
        rejectionEmailBody,
        DEFAULT_REJECTION_EMAIL_BODY
      );
    }

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

        <div className="space-y-3 rounded-xl border border-border bg-surface-raised/60 p-4">
          <p className="text-sm font-medium text-foreground">Ticket pricing</p>
          <PassFeesToBuyerField
            checked={passFeesToBuyer}
            onChange={setPassFeesToBuyer}
          />
          {!usesTicketTypeCatalog && (
            <>
              <p className="text-xs text-muted">
                Set a price to enable Stripe ticket sales on the public event page.
              </p>
              {isCompetition ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={formatPriceLabelWithBuyerFee(
                      "Leader pass (€)",
                      leaderPriceEuro,
                      passFeesToBuyer
                    )}
                    type="number"
                    min="0"
                    step="0.01"
                    value={leaderPriceEuro}
                    onChange={(e) => setLeaderPriceEuro(e.target.value)}
                    placeholder="25.00"
                  />
                  <Input
                    label={formatPriceLabelWithBuyerFee(
                      "Follower pass (€)",
                      followerPriceEuro,
                      passFeesToBuyer
                    )}
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
                  label={formatPriceLabelWithBuyerFee(
                    "Ticket price (€)",
                    ticketPriceEuro,
                    passFeesToBuyer
                  )}
                  type="number"
                  min="0"
                  step="0.01"
                  value={ticketPriceEuro}
                  onChange={(e) => setTicketPriceEuro(e.target.value)}
                  placeholder="15.00"
                />
              )}
            </>
          )}
          {usesTicketTypeCatalog && (
            <p className="text-xs text-muted">
              Applies to all passes configured in the ticket passes panel.
            </p>
          )}
        </div>

        {isCompetition && (
          <div className="space-y-4 rounded-xl border border-border bg-surface-raised/60 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Registration emails</p>
              <p className="mt-1 text-xs text-muted">
                Customize the generic email copy sent when applications are approved or
                rejected. The personalized rejection reason from the admin panel is added
                separately and is not edited here.
              </p>
              <p className="mt-2 text-xs text-muted">
                Placeholders:{" "}
                {REGISTRATION_EMAIL_PLACEHOLDERS.map(({ token, description }) => (
                  <span key={token} className="mr-3 inline-block">
                    <code className="text-brand-300">{token}</code> ({description})
                  </span>
                ))}
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border/70 bg-surface-overlay/40 p-4">
              <p className="text-sm font-medium text-foreground">Approval email</p>
              <Input
                label="Subject"
                value={approvalEmailSubject}
                onChange={(e) => setApprovalEmailSubject(e.target.value)}
              />
              <div className="space-y-1">
                <label
                  htmlFor="approval-email-body"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Message body
                </label>
                <textarea
                  id="approval-email-body"
                  rows={6}
                  value={approvalEmailBody}
                  onChange={(e) => setApprovalEmailBody(e.target.value)}
                  className={cn(
                    "block w-full resize-y rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground shadow-inner shadow-black/10",
                    "placeholder:text-muted/70",
                    "focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  )}
                />
              </div>
              <p className="text-xs text-muted">
                The payment button and event link are added automatically after this text.
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setApprovalEmailSubject(DEFAULT_APPROVAL_EMAIL_SUBJECT);
                  setApprovalEmailBody(DEFAULT_APPROVAL_EMAIL_BODY);
                }}
              >
                Reset approval email to default
              </Button>
            </div>

            <div className="space-y-3 rounded-lg border border-border/70 bg-surface-overlay/40 p-4">
              <p className="text-sm font-medium text-foreground">Rejection email</p>
              <Input
                label="Subject"
                value={rejectionEmailSubject}
                onChange={(e) => setRejectionEmailSubject(e.target.value)}
              />
              <div className="space-y-1">
                <label
                  htmlFor="rejection-email-body"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Message body
                </label>
                <textarea
                  id="rejection-email-body"
                  rows={6}
                  value={rejectionEmailBody}
                  onChange={(e) => setRejectionEmailBody(e.target.value)}
                  className={cn(
                    "block w-full resize-y rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground shadow-inner shadow-black/10",
                    "placeholder:text-muted/70",
                    "focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  )}
                />
              </div>
              <p className="text-xs text-muted">
                Your rejection reason from the registrations panel appears after this text,
                followed by the event page button.
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRejectionEmailSubject(DEFAULT_REJECTION_EMAIL_SUBJECT);
                  setRejectionEmailBody(DEFAULT_REJECTION_EMAIL_BODY);
                }}
              >
                Reset rejection email to default
              </Button>
            </div>
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
