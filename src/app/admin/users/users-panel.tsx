"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, fromTable } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, getStatusColor } from "@/lib/utils";
import {
  ASSIGNABLE_ROLES,
  COMING_SOON_ROLES,
  canDeleteUser,
  roleLabel,
  type AdminUserRow,
  type AssignableRole,
} from "@/lib/admin-users";

export function UsersPanel({
  users: initialUsers,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);
  const [error, setError] = useState("");

  async function assignRole(userId: string, role: AssignableRole) {
    setError("");
    setPendingRole(userId);

    const supabase = createClient();
    const { error: updateError } = await fromTable(supabase, "profiles")
      .update({ role })
      .eq("id", userId);

    setPendingRole(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, role } : user))
    );
    router.refresh();
  }

  async function deleteUser(user: AdminUserRow) {
    setError("");
    setDeletingId(user.id);

    const supabase = createClient();
    const { error: deleteError } = await supabase.rpc("admin_delete_user", {
      target_user_id: user.id,
    });

    setDeletingId(null);
    setConfirmDelete(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setUsers((prev) => prev.filter((entry) => entry.id !== user.id));
    router.refresh();
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="No users found"
        description="Registered accounts will appear here."
      />
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <Card
        title={`${users.length} user${users.length === 1 ? "" : "s"}`}
        description="Assign roles or remove accounts. Admin accounts cannot be deleted from here."
      >
        <div className="divide-y divide-border">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isAdmin = user.role === "admin";
            const busy = pendingRole === user.id || deletingId === user.id;

            return (
              <div
                key={user.id}
                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">
                      {user.full_name || "Unnamed user"}
                    </p>
                    {isSelf && (
                      <span className="rounded-full bg-brand-950/60 px-2 py-0.5 text-xs font-medium text-brand-300 ring-1 ring-brand-800/50">
                        You
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        getStatusColor(user.role)
                      )}
                    >
                      {roleLabel(user.role)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {!isAdmin && (
                    <div className="flex flex-wrap gap-1.5">
                      {ASSIGNABLE_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          disabled={busy || user.role === role}
                          onClick={() => assignRole(user.id, role)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                            user.role === role
                              ? "bg-brand-600 text-white shadow-sm"
                              : "border border-border bg-surface-raised text-muted hover:border-brand-700/50 hover:text-foreground disabled:opacity-40"
                          )}
                        >
                          {roleLabel(role)}
                        </button>
                      ))}
                      {COMING_SOON_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          disabled
                          title="Coming soon"
                          className={cn(
                            "cursor-not-allowed rounded-lg px-3 py-1.5 text-xs font-medium opacity-45",
                            user.role === role
                              ? "bg-brand-600/60 text-white"
                              : "border border-border bg-surface-raised text-muted"
                          )}
                        >
                          {roleLabel(role)}
                          <span className="ml-1 text-[10px] uppercase tracking-wide opacity-80">
                            · Coming soon
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {canDeleteUser(user, currentUserId) ? (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={deletingId === user.id}
                      onClick={() => setConfirmDelete(user)}
                    >
                      Delete
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {isAdmin ? "Protected admin" : "Cannot delete"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface-overlay p-6 shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-foreground">Delete user</h3>
            <p className="mt-2 text-sm text-muted">
              Permanently delete{" "}
              <strong className="text-foreground">{confirmDelete.full_name}</strong>{" "}
              ({confirmDelete.email})? This removes their profile, registrations, and
              scores. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="danger"
                loading={deletingId === confirmDelete.id}
                onClick={() => deleteUser(confirmDelete)}
              >
                Delete user
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
