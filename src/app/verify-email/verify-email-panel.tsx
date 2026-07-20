"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    const redirectTo = `${window.location.origin}/auth/callback?next=/profile/setup`;

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
        <Link
          href="/profile/setup"
          className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Continue to profile setup
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
        <p className="text-sm text-gray-600">
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <Button
          type="button"
          className="w-full"
          onClick={resendEmail}
          disabled={loading}
        >
          {loading ? "Sending..." : "Resend verification email"}
        </Button>

        <p className="text-center text-sm text-gray-500">
          Already verified?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </Card>
  );
}
