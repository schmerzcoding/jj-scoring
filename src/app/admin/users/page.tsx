import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UsersPanel } from "./users-panel";
import type { AdminUserRow } from "@/lib/admin-users";

export default async function AdminUsersPage() {
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

  const { data: users, error } = await supabase.rpc("admin_list_users");

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin"
          className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
        >
          &larr; Back to dashboard
        </Link>
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
          Could not load users: {error.message}. Run migration{" "}
          <code className="text-red-200">010_admin_user_management.sql</code> in
          Supabase SQL Editor.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Users</h1>
        <p className="mt-1 text-muted">
          Manage registered accounts, roles, and access.
        </p>
      </div>

      <UsersPanel
        users={(users ?? []) as AdminUserRow[]}
        currentUserId={user.id}
      />
    </div>
  );
}
