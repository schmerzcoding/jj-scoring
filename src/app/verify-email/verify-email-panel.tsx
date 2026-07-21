"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authCallbackUrl } from "@/lib/auth-redirect";

export function VerifyEmailPanel({
  email: initialEmail,
  verified,
}: {
  email?: string;
  verified: boolean;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function resendEmail() {
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const redirectTo = authCallbackUrl("/profile/setup");

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setMessage("Verification email sent. Check your inbox (and spam folder).");
  }

  if (verified) {
    return (
      <Card
        title="Email verified"
        description="Your email is confirmed. You can continue setting up your profile."
      >
        <Link href="/profile/setup">
          <Button>Continue to profile setup</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card
      title="Verify your email"
      description="We sent a confirmation link to your inbox. Click it to activate your account."
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          After confirming, you&apos;ll complete your dancer profile before
          registering for competitions.
        </p>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}

        <Button
          type="button"
          className="w-full"
          onClick={resendEmail}
          loading={loading}
        >
          {loading ? "Sending..." : "Resend verification email"}
        </Button>

        <p className="text-center text-sm text-muted">
          Already verified?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </Card>
  );
}
