import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { confirmCheckoutSessionById } from "@/lib/stripe-fulfillment";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }

  try {
    const result = await confirmCheckoutSessionById(body.sessionId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Stripe confirm error:", error);
    return NextResponse.json(
      { error: "Could not confirm payment." },
      { status: 500 }
    );
  }
}
