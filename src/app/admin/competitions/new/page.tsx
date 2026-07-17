"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NewCompetitionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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

    const { data, error: insertError } = await supabase
      .from("competitions")
      .insert({
        name,
        description: description || null,
        location: location || null,
        event_date: eventDate || null,
        status: status as "draft" | "open" | "closed" | "in_progress" | "completed",
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

    router.push(`/admin/competitions/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card title="New Competition" description="Create a new Jack & Jill event">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Input
            label="Event date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Registration open</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Competition"}
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
