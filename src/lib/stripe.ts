import Stripe from "stripe";
import { BRAND_URL } from "@/lib/brand";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      typescript: true,
    });
  }

  return stripeClient;
}

export function getSiteUrl(request?: Request): string {
  if (request) {
    const origin = request.headers.get("origin");
    if (origin?.startsWith("http")) {
      return origin.replace(/\/$/, "");
    }

    const referer = request.headers.get("referer");
    if (referer) {
      try {
        return new URL(referer).origin;
      } catch {
        // ignore invalid referer
      }
    }
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return BRAND_URL.replace(/\/$/, "") || "http://localhost:3000";
}
