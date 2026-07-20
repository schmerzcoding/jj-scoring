"use client";

import { useState } from "react";
import { createClient, fromTable } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/country-select";
import type { ProfileFormValues } from "@/lib/profile";
import type { ProfileDanceRole, ProfileGender } from "@/types/database";

export type { ProfileFormValues } from "@/lib/profile";

const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const DANCE_ROLE_OPTIONS = [
  { value: "", label: "Select dance role" },
  { value: "leader", label: "Leader" },
  { value: "follower", label: "Follower" },
  { value: "both", label: "Both" },
];

export function ProfileForm({
  initialValues,
  submitLabel,
  onSubmit,
  onFullNameChange,
}: {
  initialValues: ProfileFormValues;
  submitLabel: string;
  onSubmit: (values: ProfileFormValues) => Promise<{ error?: string }>;
  onFullNameChange?: (name: string) => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!values.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!values.danceRole) {
      setError("Please select your usual dance role.");
      return;
    }

    const ageValue = values.age ? parseInt(values.age, 10) : NaN;
    if (!values.age || isNaN(ageValue) || ageValue < 13 || ageValue > 120) {
      setError("Please enter a valid age (13–120).");
      return;
    }

    setLoading(true);
    const result = await onSubmit(values);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full name"
        value={values.fullName}
        onChange={(e) => {
          setValues({ ...values, fullName: e.target.value });
          onFullNameChange?.(e.target.value);
        }}
        required
      />

      <div className="space-y-1">
        <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground">
          About you
        </label>
        <textarea
          id="bio"
          value={values.bio}
          onChange={(e) => setValues({ ...values, bio: e.target.value })}
          rows={4}
          placeholder="Tell organizers a bit about your dancing experience..."
          className="block w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground shadow-inner shadow-black/10 placeholder:text-muted/70 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
        />
      </div>

      <CountrySelect
        label="Country of origin"
        value={values.countryCode}
        onChange={(countryCode) => setValues({ ...values, countryCode })}
      />

      <Select
        label="Gender"
        value={values.gender}
        onChange={(e) =>
          setValues({
            ...values,
            gender: e.target.value as ProfileGender | "",
          })
        }
        options={GENDER_OPTIONS}
      />

      <Select
        label="Usual dance role"
        value={values.danceRole}
        onChange={(e) =>
          setValues({
            ...values,
            danceRole: e.target.value as ProfileDanceRole | "",
          })
        }
        options={DANCE_ROLE_OPTIONS}
      />

      <Input
        label="Age"
        type="number"
        min="13"
        max="120"
        value={values.age}
        onChange={(e) => setValues({ ...values, age: e.target.value })}
        required
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-400">Profile saved successfully.</p>
      )}

      <Button type="submit" className="w-full" loading={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

export async function saveProfileValues(
  userId: string,
  values: ProfileFormValues,
  markCompleted: boolean
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await fromTable(supabase, "profiles")
    .update({
      full_name: values.fullName.trim(),
      bio: values.bio.trim() || null,
      gender: values.gender || null,
      dance_role: values.danceRole || null,
      age: parseInt(values.age, 10),
      country_code: values.countryCode || null,
      ...(markCompleted ? { profile_completed: true } : {}),
    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  return {};
}
