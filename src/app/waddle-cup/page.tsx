import type { Metadata } from "next";
import { WaddleCupLanding } from "@/components/waddle-cup/waddle-cup-landing";
import { createClient } from "@/lib/supabase/server";
import { fetchWaddleCupEvent } from "@/lib/waddle-cup";

export const metadata: Metadata = {
  title: "The Waddle Cup",
  description:
    "Workshops, Jack & Jill competition, and social — The Waddle Cup in Dublin.",
};

export default async function WaddleCupPage() {
  const supabase = await createClient();
  const event = await fetchWaddleCupEvent(supabase);

  return <WaddleCupLanding event={event} />;
}
