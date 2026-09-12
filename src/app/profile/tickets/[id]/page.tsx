import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { isAdminRole } from "@/lib/auth";
import { ensureTicketQrToken } from "@/lib/ticket-qr";
import { formatPassTypeLabel } from "@/lib/ticket-pass";
import { eventTypeLabel } from "@/lib/events";
import { formatEventSchedule } from "@/lib/utils";
import { getCountryName } from "@/lib/countries";
import { TicketQrDisplay } from "@/components/ticket-qr-display";
import { EventTypeBadge } from "@/components/event-type-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export default async function ProfileTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/profile/setup");
  if (isAdminRole(profile.role)) redirect("/admin");

  const { data: ticket } = await supabase
    .from("ticket_purchases")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "paid")
    .maybeSingle();

  if (!ticket) notFound();

  const admin = createAdminClient();
  const qrToken = (await ensureTicketQrToken(admin, ticket.id)) ?? ticket.qr_token;

  if (!qrToken) notFound();

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", ticket.competition_id)
    .single();

  if (!competition) notFound();

  const passLabel = formatPassTypeLabel(ticket.pass_type, ticket.role);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/profile"
          className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
        >
          &larr; Back to profile
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{competition.name}</h1>
          <EventTypeBadge type={competition.event_type} />
        </div>
        <p className="mt-1 text-sm capitalize text-muted">
          {eventTypeLabel(competition.event_type)}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col items-center text-center">
          <TicketQrDisplay token={qrToken} size={220} />
          <p className="mt-4 text-sm text-muted">
            Show this code at the door for entry verification.
          </p>
        </div>

        <dl className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Guest</dt>
            <dd className="font-medium text-foreground">{profile.full_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Pass type</dt>
            <dd className="font-medium text-foreground">{passLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Date</dt>
            <dd className="text-right text-foreground">
              {formatEventSchedule(
                competition.event_date,
                competition.start_time,
                competition.end_time
              )}
            </dd>
          </div>
          {(competition.location || competition.country_code) && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Location</dt>
              <dd className="text-right text-foreground">
                {[
                  competition.location,
                  competition.country_code
                    ? getCountryName(competition.country_code)
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Status</dt>
            <dd>
              {ticket.checked_in_at ? (
                <span className="font-medium text-emerald-400">Checked in</span>
              ) : (
                <span className="text-foreground">Valid — not checked in yet</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/competitions/${competition.id}`}>
          <Button variant="secondary">Event details</Button>
        </Link>
        <StatusBadge status={competition.status} />
      </div>
    </div>
  );
}
