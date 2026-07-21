"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { PasswordForm } from "@/components/password-form";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setLoading(false);
    }

    void loadUser();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-md">
        <Card title="Choose a new password" description="Loading...">
          <p className="text-sm text-muted">Please wait...</p>
        </Card>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="mx-auto max-w-md">
        <Card
          title="Link expired"
          description="This password reset link is invalid or has expired."
        >
          <p className="text-center text-sm text-muted">
            <Link
              href="/forgot-password"
              className="text-brand-400 hover:text-brand-300 hover:underline"
            >
              Request a new reset link
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Card
        title="Choose a new password"
        description="Enter your new password twice. It must be different from your current password."
      >
        <PasswordForm mode="reset" email={email} />
        <p className="mt-4 text-center text-sm text-muted">
          Link expired?{" "}
          <Link
            href="/forgot-password"
            className="text-brand-400 hover:text-brand-300 hover:underline"
          >
            Request a new reset link
          </Link>
        </p>
      </Card>
    </div>
  );
}
