import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TicketCheckInScanner } from "@/components/ticket-check-in-scanner";

export default async function AdminCheckInPage({
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!competition) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/admin/competitions/${id}`}
          className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
        >
          &larr; Back to event
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Door check-in</h1>
        <p className="mt-1 text-muted">{competition.name}</p>
      </div>

      <TicketCheckInScanner
        competitionId={competition.id}
        eventName={competition.name}
      />
    </div>
  );
}
