"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPostLoginPath } from "@/lib/auth";
import {
  isSameAsExistingPassword,
  updateUserPassword,
  verifyCurrentPassword,
} from "@/lib/password-auth";
import {
  validatePasswordChange,
  validatePasswordPair,
} from "@/lib/password-validation";

type PasswordFormMode = "change" | "reset";

export function PasswordForm({
  mode,
  email,
}: {
  mode: PasswordFormMode;
  email: string;
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError =
      mode === "change"
        ? validatePasswordChange(currentPassword, newPassword, confirmPassword)
        : validatePasswordPair(newPassword, confirmPassword);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "change") {
      const currentValid = await verifyCurrentPassword(
        supabase,
        email,
        currentPassword
      );
      if (!currentValid) {
        setError("Current password is incorrect.");
        setLoading(false);
        return;
      }
    } else {
      const sameAsBefore = await isSameAsExistingPassword(
        supabase,
        email,
        newPassword
      );
      if (sameAsBefore) {
        setError("New password must be different from your current password.");
        setLoading(false);
        return;
      }
    }

    const updateError = await updateUserPassword(supabase, newPassword);
    if (updateError) {
      setError(updateError);
      setLoading(false);
      return;
    }

    if (mode === "reset") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, profile_completed")
          .eq("id", user.id)
          .single();

        router.push(getPostLoginPath(profile));
        router.refresh();
        return;
      }

      router.push("/login?reset=success");
      router.refresh();
      return;
    }

    router.push("/profile?password=updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "change" && (
        <Input
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      )}
      <Input
        label="New password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        minLength={6}
        required
      />
      <Input
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        minLength={6}
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full" loading={loading}>
        {loading
          ? "Saving..."
          : mode === "change"
            ? "Update password"
            : "Set new password"}
      </Button>
    </form>
  );
}
