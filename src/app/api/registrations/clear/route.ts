import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { registrationId?: string };
    const registrationId = body.registrationId;

    if (!registrationId) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: registration, error: registrationError } = await admin
      .from("registrations")
      .select("id, status")
      .eq("id", registrationId)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }

    if (registration.status !== "withdrawn") {
      return NextResponse.json(
        { error: "Only withdrawn registrations can be cleared." },
        { status: 400 }
      );
    }

    const { error: deleteError } = await admin
      .from("registrations")
      .delete()
      .eq("id", registrationId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Registration clear error:", error);
    return NextResponse.json(
      { error: "Could not clear registration." },
      { status: 500 }
    );
  }
}
