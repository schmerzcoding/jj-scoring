"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { RegistrationWithProfile } from "@/types/database";

export function RegistrationsPanel({
  registrations,
  requiresPayment = false,
  paidUserIds = [],
}: {
  registrations: RegistrationWithProfile[];
  requiresPayment?: boolean;
  paidUserIds?: string[];
}) {
  const router = useRouter();
  const paidUserIdSet = new Set(paidUserIds);
  const pending = registrations.filter((registration) => registration.status === "pending");
  const approved = registrations.filter((registration) => registration.status === "approved");
  const confirmedCount = requiresPayment
    ? approved.filter((registration) => paidUserIdSet.has(registration.user_id)).length
    : approved.length;

  async function updateStatus(
    registrationId: string,
    status: "approved" | "rejected" | "withdrawn"
  ) {
    const response = await fetch("/api/registrations/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, status }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      emailWarning?: string;
    };

    if (!response.ok || !data.ok) {
      window.alert(data.error ?? "Could not update registration.");
      return;
    }

    if (data.emailWarning) {
      window.alert(data.emailWarning);
    }

    router.refresh();
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

  return (
    <Card
      title="Registrations"
      description={
        requiresPayment
          ? `${confirmedCount} confirmed, ${approved.length - confirmedCount} awaiting payment, ${pending.length} pending review`
          : `${approved.length} approved, ${pending.length} pending`
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
        <div className="divide-y divide-border">
          {registrations.map((reg) => {
            const hasPaid = paidUserIdSet.has(reg.user_id);
            const isConfirmed = reg.status === "approved" && (!requiresPayment || hasPaid);

            return (
              <div
                key={reg.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {reg.display_name ?? reg.profile?.full_name ?? "Unknown"}
                  </span>
                  <span className="ml-2 text-sm capitalize text-muted">
                    ({reg.role})
                  </span>
                  {requiresPayment && reg.status === "approved" && (
                    <span className="ml-2 text-xs text-muted">
                      {hasPaid ? "· Paid" : "· Awaiting payment"}
                    </span>
                  )}
                  {isConfirmed && (
                    <span className="ml-2 text-xs font-medium text-emerald-400">
                      Confirmed
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={reg.status} />
                  {reg.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => void updateStatus(reg.id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void updateStatus(reg.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {reg.status === "approved" && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeFromCompetition(reg)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
