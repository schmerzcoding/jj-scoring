import { Suspense } from "react";
import { ForgotPasswordPanel } from "./forgot-password-panel";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md animate-pulse rounded-2xl border border-border bg-surface-raised/50 p-8">
          <div className="h-6 w-40 rounded bg-surface-raised" />
          <div className="mt-3 h-4 w-full rounded bg-surface-raised" />
          <div className="mt-6 h-10 w-full rounded-xl bg-surface-raised" />
        </div>
      }
    >
      <ForgotPasswordPanel />
    </Suspense>
  );
}
