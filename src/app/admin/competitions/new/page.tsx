import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateEventForm } from "@/components/create-event-form";
import { requireFullAdmin } from "@/lib/admin-page-auth";

export default async function AdminNewEventPage() {
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

  requireFullAdmin(profile?.role);

  return <CreateEventForm manageBasePath="/admin/competitions" />;
}
