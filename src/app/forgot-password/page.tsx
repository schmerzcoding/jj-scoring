"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BRAND_NAME } from "@/lib/brand";
import { authCallbackUrl } from "@/lib/auth-redirect";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: authCallbackUrl("/reset-password"),
      }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage(
      "If an account exists for this email, we sent a password reset link. Check your inbox and spam folder."
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Card
        title="Reset password"
        description={`Enter your email and we'll send you a link to reset your ${BRAND_NAME} password.`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Remember your password?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
