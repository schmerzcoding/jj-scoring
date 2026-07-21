"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountrySelect } from "@/components/country-select";
import { uploadCompetitionBanner } from "@/components/competition-banner-upload";
import { EVENT_TYPE_SELECT_OPTIONS } from "@/lib/events";
import type { CompetitionStatus, EventType } from "@/types/database";

export function CreateEventForm({
  manageBasePath,
}: {
  manageBasePath: string;
}) {
  const router = useRouter();
  const [eventType, setEventType] = useState<EventType>("social");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [status, setStatus] = useState<CompetitionStatus>("draft");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleBannerSelect(file: File | null) {
    setBannerFile(file);
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
    }
    setBannerPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!countryCode) {
      setError("Please select the event country.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await fromTable(supabase, "competitions")
      .insert({
        name,
        description: description || null,
        location: location || null,
        country_code: countryCode,
        event_date: eventDate || null,
        event_type: eventType,
        status,
        registration_open: registrationOpen,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (bannerFile && data?.id) {
      const bannerResult = await uploadCompetitionBanner(data.id, bannerFile);
      if (bannerResult.error) {
        setError(`Event created, but banner upload failed: ${bannerResult.error}`);
        setLoading(false);
        router.push(`${manageBasePath}/${data.id}`);
        return;
      }
    }

    router.push(`${manageBasePath}/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card
        title="Create event"
        description="Add a dance event for Dublin and beyond. You can refine type-specific details later."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Event type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            options={EVENT_TYPE_SELECT_OPTIONS}
          />
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground shadow-inner shadow-black/10 placeholder:text-muted/70 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
            />
          </div>
          <CountrySelect
            label="Country"
            value={countryCode}
            onChange={setCountryCode}
            required
          />
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, venue, etc."
          />
          <Input
            label="Event date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <div>
            <p className="mb-2 block text-sm font-medium text-muted-foreground">
              Banner image
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              {bannerPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="aspect-[3/1] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[3/1] items-center justify-center text-sm text-muted-foreground">
                  No banner selected
                </div>
              )}
            </div>
            <label className="mt-2 inline-flex cursor-pointer rounded-xl border border-border bg-surface-overlay px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-700/50 hover:bg-surface-hover">
              Choose banner
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) =>
                  handleBannerSelect(e.target.files?.[0] ?? null)
                }
              />
            </label>
            <p className="mt-1 text-xs text-muted">
              Wide festival or event image. JPEG, PNG, WebP. Max 5 MB.
            </p>
          </div>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CompetitionStatus)}
            options={[
              { value: "draft", label: "Draft" },
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={registrationOpen}
              onChange={(e) => setRegistrationOpen(e.target.checked)}
              className="rounded border-border bg-surface-raised text-brand-500 focus:ring-brand-600/30"
            />
            <span className="text-sm text-foreground">Registration open</span>
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              {loading ? "Creating..." : "Create event"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
