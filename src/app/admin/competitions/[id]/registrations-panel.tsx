"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/avatar-upload";
import { cn } from "@/lib/utils";
import type { RegistrationWithProfile } from "@/types/database";

export function RegistrationsPanel({
  registrations,
  requiresPayment = false,
  paidUserIds = [],
  showAdminTools = false,
  readOnly = false,
}: {
  registrations: RegistrationWithProfile[];
  requiresPayment?: boolean;
  paidUserIds?: string[];
  showAdminTools?: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const paidUserIdSet = new Set(paidUserIds);
  const pending = registrations.filter((registration) => registration.status === "pending");
  const approved = registrations.filter((registration) => registration.status === "approved");
  const otherRegistrations = registrations.filter(
    (registration) => registration.status !== "approved"
  );
  const approvedLeaders = approved.filter((registration) => registration.role === "leader");
  const approvedFollowers = approved.filter((registration) => registration.role === "follower");
  const confirmedCount = requiresPayment
    ? approved.filter((registration) => paidUserIdSet.has(registration.user_id)).length
    : approved.length;

  const [rejectTarget, setRejectTarget] = useState<RegistrationWithProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [clearingId, setClearingId] = useState<string | null>(null);

  useEffect(() => {
    if (!rejectTarget) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !rejectLoading) {
        setRejectTarget(null);
        setRejectionReason("");
        setRejectError("");
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [rejectTarget, rejectLoading]);

  async function updateStatus(
    registrationId: string,
    status: "approved" | "rejected" | "withdrawn",
    options?: { rejectionReason?: string }
  ) {
    const response = await fetch("/api/registrations/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId,
        status,
        rejectionReason: options?.rejectionReason,
      }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      emailWarning?: string;
    };

    if (!response.ok || !data.ok) {
      window.alert(data.error ?? "Could not update registration.");
      return false;
    }

    if (data.emailWarning) {
      window.alert(data.emailWarning);
    }

    router.refresh();
    return true;
  }

  async function clearWithdrawnRegistration(reg: RegistrationWithProfile) {
    const name = reg.display_name ?? reg.profile?.full_name ?? "this participant";
    const message = `Clear ${name}'s withdrawn registration?\n\nThey will be able to submit a new application for this competition.`;

    if (!window.confirm(message)) return;

    setClearingId(reg.id);

    try {
      const response = await fetch("/api/registrations/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: reg.id }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        window.alert(data.error ?? "Could not clear registration.");
        return;
      }

      router.refresh();
    } finally {
      setClearingId(null);
    }
  }

  function removeFromCompetition(reg: RegistrationWithProfile) {
    const name = reg.display_name ?? reg.profile?.full_name ?? "this participant";
    const confirmed = paidUserIdSet.has(reg.user_id);

    const message = confirmed
      ? `Remove ${name} from this competition?\n\nThey will no longer appear as a participant. Their ticket payment will not be refunded automatically.`
      : `Remove ${name} from this competition?\n\nThey will no longer appear as a participant.`;

    if (!window.confirm(message)) return;

    void updateStatus(reg.id, "withdrawn");
  }

  function openRejectModal(reg: RegistrationWithProfile) {
    setRejectTarget(reg);
    setRejectionReason("");
    setRejectError("");
  }

  function closeRejectModal() {
    if (rejectLoading) return;
    setRejectTarget(null);
    setRejectionReason("");
    setRejectError("");
  }

  async function submitRejection() {
    if (!rejectTarget) return;

    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setRejectError("Please enter a reason for the rejection.");
      return;
    }

    setRejectError("");
    setRejectLoading(true);

    const ok = await updateStatus(rejectTarget.id, "rejected", {
      rejectionReason: trimmedReason,
    });

    setRejectLoading(false);

    if (ok) {
      closeRejectModal();
    }
  }

  return (
    <>
      <Card
        title="Registrations"
        description={
          requiresPayment
            ? `${confirmedCount} confirmed, ${approved.length - confirmedCount} awaiting payment, ${pending.length} pending review · ${approvedLeaders.length} leaders, ${approvedFollowers.length} followers`
            : `${approved.length} approved (${approvedLeaders.length} leaders, ${approvedFollowers.length} followers), ${pending.length} pending`
        }
      >
        {registrations.length === 0 ? (
          <EmptyState
            icon="users"
            title="No registrations yet"
            description="Participants will appear here once they sign up for this event."
            compact
          />
        ) : (
          <div className="space-y-8">
            {otherRegistrations.length > 0 && (
              <div className="divide-y divide-border">
                {otherRegistrations.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    reg={reg}
                    requiresPayment={requiresPayment}
                    hasPaid={paidUserIdSet.has(reg.user_id)}
                    readOnly={readOnly}
                    showAdminTools={showAdminTools}
                    clearingId={clearingId}
                    onApprove={() => void updateStatus(reg.id, "approved")}
                    onReject={() => openRejectModal(reg)}
                    onRemove={() => removeFromCompetition(reg)}
                    onClear={() => void clearWithdrawnRegistration(reg)}
                  />
                ))}
              </div>
            )}

            {approved.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  Approved participants
                </h3>
                <div className="grid gap-6 lg:grid-cols-2">
                  <ApprovedRoleColumn
                    label="Leaders"
                    registrations={approvedLeaders}
                    requiresPayment={requiresPayment}
                    paidUserIdSet={paidUserIdSet}
                    readOnly={readOnly}
                    onRemove={removeFromCompetition}
                  />
                  <ApprovedRoleColumn
                    label="Followers"
                    registrations={approvedFollowers}
                    requiresPayment={requiresPayment}
                    paidUserIdSet={paidUserIdSet}
                    readOnly={readOnly}
                    onRemove={removeFromCompetition}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={closeRejectModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface-overlay p-6 shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-registration-title"
          >
            <h3 id="reject-registration-title" className="text-lg font-semibold text-foreground">
              Reject application
            </h3>
            <p className="mt-2 text-sm text-muted">
              Reject{" "}
              <strong className="text-foreground">
                {rejectTarget.display_name ?? rejectTarget.profile?.full_name ?? "this participant"}
              </strong>
              . The reason below will be included in the email sent to them.
            </p>

            <div className="mt-4 space-y-1">
              <label
                htmlFor="rejection-reason"
                className="block text-sm font-medium text-muted-foreground"
              >
                Reason for rejection
              </label>
              <textarea
                id="rejection-reason"
                rows={4}
                value={rejectionReason}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  if (rejectError) setRejectError("");
                }}
                placeholder="Explain why this application was not approved..."
                className={cn(
                  "block w-full resize-y rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground shadow-inner shadow-black/10",
                  "placeholder:text-muted/70",
                  "focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30",
                  rejectError && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                )}
              />
              {rejectError && <p className="text-sm text-red-400">{rejectError}</p>}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                disabled={rejectLoading}
                onClick={closeRejectModal}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="w-full sm:w-auto"
                loading={rejectLoading}
                onClick={() => void submitRejection()}
              >
                Reject and send email
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function registrationDisplayName(reg: RegistrationWithProfile): string {
  return reg.display_name ?? reg.profile?.full_name ?? "Unknown";
}

function RegistrationRow({
  reg,
  requiresPayment,
  hasPaid,
  readOnly,
  showAdminTools,
  clearingId,
  onApprove,
  onReject,
  onRemove,
  onClear,
  compact = false,
}: {
  reg: RegistrationWithProfile;
  requiresPayment: boolean;
  hasPaid: boolean;
  readOnly: boolean;
  showAdminTools?: boolean;
  clearingId?: string | null;
  onApprove?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  onClear?: () => void;
  compact?: boolean;
}) {
  const isConfirmed = reg.status === "approved" && (!requiresPayment || hasPaid);
  const displayName = registrationDisplayName(reg);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between",
        compact && "py-2"
      )}
    >
      <div className="flex min-w-0 gap-3">
        <UserAvatar name={displayName} avatarUrl={reg.profile?.avatar_url} size="sm" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-foreground">{displayName}</span>
            {!compact && (
              <span className="text-sm capitalize text-muted">({reg.role})</span>
            )}
            {reg.status !== "approved" && (
              <StatusBadge status={reg.status} className="sm:hidden" />
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {requiresPayment && reg.status === "approved" && (
              <span className="text-xs text-muted">
                {hasPaid ? "Paid" : "Awaiting payment"}
              </span>
            )}
            {isConfirmed && (
              <span className="text-xs font-medium text-emerald-400">Confirmed</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
        {reg.status !== "approved" && (
          <StatusBadge status={reg.status} className="hidden sm:inline-flex" />
        )}
        {!readOnly && reg.status === "pending" && (
          <>
            <Button size="sm" className="flex-1 sm:flex-none" onClick={onApprove}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="flex-1 sm:flex-none"
              onClick={onReject}
            >
              Reject
            </Button>
          </>
        )}
        {!readOnly && reg.status === "approved" && (
          <Button
            size="sm"
            variant="danger"
            className="flex-1 sm:flex-none"
            onClick={onRemove}
          >
            Remove
          </Button>
        )}
        {showAdminTools && reg.status === "withdrawn" && (
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 sm:flex-none"
            loading={clearingId === reg.id}
            onClick={onClear}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function ApprovedRoleColumn({
  label,
  registrations,
  requiresPayment,
  paidUserIdSet,
  readOnly,
  onRemove,
}: {
  label: string;
  registrations: RegistrationWithProfile[];
  requiresPayment: boolean;
  paidUserIdSet: Set<string>;
  readOnly: boolean;
  onRemove: (reg: RegistrationWithProfile) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised/40 p-3">
      <h4 className="mb-2 flex items-baseline justify-between gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs font-semibold text-foreground ring-1 ring-border">
          {registrations.length}
        </span>
      </h4>
      {registrations.length === 0 ? (
        <EmptyState title={`No ${label.toLowerCase()} yet`} compact className="py-2" />
      ) : (
        <div className="divide-y divide-border">
          {registrations.map((reg) => (
            <RegistrationRow
              key={reg.id}
              reg={reg}
              requiresPayment={requiresPayment}
              hasPaid={paidUserIdSet.has(reg.user_id)}
              readOnly={readOnly}
              compact
              onRemove={() => onRemove(reg)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
