import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateEventForm } from "@/components/create-event-form";

export default async function OrganizerNewEventPage() {
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

  if (profile?.role !== "organizer" && profile?.role !== "admin") redirect("/");

  return (
    <div className="space-y-6">
      <Link
        href="/organizer"
        className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
      >
        &larr; Back to organizer dashboard
      </Link>
      <CreateEventForm manageBasePath="/organizer/events" />
    </div>
  );
}
