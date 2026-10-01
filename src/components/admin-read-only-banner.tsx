import { PSEUDO_ADMIN_ROLE_LABEL } from "@/lib/admin-access";

export function AdminReadOnlyBanner() {
  return (
    <div className="rounded-xl border border-sky-800/50 bg-sky-950/40 p-4">
      <p className="text-sm text-sky-100">
        You are signed in as <strong>{PSEUDO_ADMIN_ROLE_LABEL}</strong>. You can
        view admin data but cannot create, edit, or delete anything.
      </p>
    </div>
  );
}
