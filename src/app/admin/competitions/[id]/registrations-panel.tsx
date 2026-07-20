"use client";

import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { RegistrationWithProfile } from "@/types/database";

export function RegistrationsPanel({
  registrations,
}: {
  registrations: RegistrationWithProfile[];
}) {
  const router = useRouter();
  const pending = registrations.filter((r) => r.status === "pending");
  const approved = registrations.filter((r) => r.status === "approved");

  async function updateStatus(
    registrationId: string,
    status: "approved" | "rejected"
  ) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await fromTable(supabase, "registrations")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", registrationId);

    router.refresh();
  }

  return (
    <Card
      title="Registrations"
      description={`${approved.length} approved, ${pending.length} pending`}
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
          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <span className="font-medium text-foreground">
                  {reg.display_name ?? reg.profile?.full_name ?? "Unknown"}
                </span>
                <span className="ml-2 text-sm capitalize text-muted">
                  ({reg.role})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={reg.status} />
                {reg.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(reg.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => updateStatus(reg.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
