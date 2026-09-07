"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CheckoutSuccessSync({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  useEffect(() => {
    async function confirmPayment() {
      try {
        await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch {
        // Webhook may still complete the purchase.
      } finally {
        router.refresh();
      }
    }

    void confirmPayment();
  }, [sessionId, router]);

  return null;
}
