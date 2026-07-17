import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
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

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .order("created_at", { ascending: false });

  const { count: pendingCount } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-600">Manage competitions and registrations.</p>
        </div>
        <Link href="/admin/competitions/new">
          <Button>New Competition</Button>
        </Link>
      </div>

      {pendingCount !== null && pendingCount > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            {pendingCount} registration{pendingCount > 1 ? "s" : ""} pending approval.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900">Competitions</h2>
        <div className="mt-4 grid gap-4">
          {competitions?.length === 0 && (
            <p className="text-gray-500">No competitions yet. Create your first one!</p>
          )}
          {competitions?.map((comp) => (
            <Link
              key={comp.id}
              href={`/admin/competitions/${comp.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                <div className="mt-1 flex gap-4 text-sm text-gray-500">
                  {comp.location && <span>{comp.location}</span>}
                  <span>{formatDate(comp.event_date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {comp.registration_open && (
                  <span className="text-xs font-medium text-green-600">Reg. open</span>
                )}
                <StatusBadge status={comp.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
