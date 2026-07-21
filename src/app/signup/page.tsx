"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPostLoginPath } from "@/lib/auth";
import { authCallbackUrl } from "@/lib/auth-redirect";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const redirectTo = authCallbackUrl("/profile/setup");

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { role: "participant" },
      },
    });

    if (authError) {
      const message =
        authError.message ||
        "Sign up failed. Check that the database migration was run in Supabase.";
      setError(
        authError.status === 500
          ? `${message} (Server error — run supabase/migrations/001 and 002 in SQL Editor)`
          : message
      );
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Account could not be created. Please try again.");
      setLoading(false);
      return;
    }

    if (data.session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, profile_completed")
        .eq("id", data.user.id)
        .single();

      router.push(getPostLoginPath(profile));
    } else {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    }

    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <Card
        title="Sign up"
        description="Create your account and complete your dancer profile"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
