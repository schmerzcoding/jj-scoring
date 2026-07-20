"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CountrySelect } from "@/components/country-select";
import { CompetitionBannerUpload } from "@/components/competition-banner-upload";
import { createClient, fromTable } from "@/lib/supabase/client";
import type { Competition } from "@/types/database";
import { Button } from "@/components/ui/button";
import { getCountryName } from "@/lib/countries";

export function CompetitionBranding({
  competition,
}: {
  competition: Competition;
}) {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState(competition.country_code ?? "");
  const [bannerUrl, setBannerUrl] = useState(competition.banner_url);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function saveCountry() {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await fromTable(supabase, "competitions")
      .update({ country_code: countryCode || null })
      .eq("id", competition.id);

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Country updated.");
    router.refresh();
  }

  return (
    <Card title="Branding" description="Banner and country shown on the competitions page">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Current country: {getCountryName(competition.country_code) || "Not set"}
        </p>
        <CountrySelect
          label="Country"
          value={countryCode}
          onChange={setCountryCode}
          required
        />
        <Button size="sm" onClick={saveCountry} loading={loading}>
          {loading ? "Saving..." : "Save country"}
        </Button>
        <CompetitionBannerUpload
          competitionId={competition.id}
          bannerUrl={bannerUrl}
          onUploaded={(url) => {
            setBannerUrl(url);
            router.refresh();
          }}
        />
        {message && <p className="text-sm text-emerald-400">{message}</p>}
      </div>
    </Card>
  );
}
