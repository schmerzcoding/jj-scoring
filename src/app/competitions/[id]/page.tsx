import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { RegistrationForm } from "./registration-form";

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();

  if (!competition) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingRegistration = null;
  if (user) {
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .eq("competition_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    existingRegistration = data;
  }

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("order_index");

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {competition.name}
            </h1>
            {competition.description && (
              <p className="mt-2 text-gray-600">{competition.description}</p>
            )}
          </div>
          <StatusBadge status={competition.status} />
        </div>
        <div className="mt-4 flex gap-6 text-sm text-gray-500">
          {competition.location && <span>{competition.location}</span>}
          <span>{formatDate(competition.event_date)}</span>
        </div>
      </div>

      {competition.registration_open && user && !existingRegistration && (
        <RegistrationForm competitionId={id} />
      )}

      {existingRegistration && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Your Registration</h2>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-sm capitalize text-gray-600">
              Role: {existingRegistration.role}
            </span>
            <StatusBadge status={existingRegistration.status} />
          </div>
          {existingRegistration.status === "pending" && (
            <p className="mt-2 text-sm text-gray-500">
              Your registration is pending admin approval.
            </p>
          )}
        </div>
      )}

      {rounds && rounds.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Rounds</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rounds.map((round) => (
              <div
                key={round.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{round.name}</span>
                  <StatusBadge status={round.status} />
                </div>
                <p className="mt-1 text-xs capitalize text-gray-500">
                  {round.role_type}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
