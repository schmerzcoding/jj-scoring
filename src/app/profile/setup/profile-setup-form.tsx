"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  ProfileForm,
  saveProfileValues,
  type ProfileFormValues,
} from "@/components/profile-form";

export function ProfileSetupForm({
  userId,
  initialValues,
}: {
  userId: string;
  initialValues: ProfileFormValues;
}) {
  const router = useRouter();

  async function handleSubmit(values: ProfileFormValues) {
    const result = await saveProfileValues(userId, values, true);
    if (!result.error) {
      router.push("/competitions");
      router.refresh();
    }
    return result;
  }

  return (
    <Card
      title="Complete your profile"
      description="Tell us a bit about yourself before joining competitions."
    >
      <ProfileForm
        initialValues={initialValues}
        submitLabel="Save and continue"
        onSubmit={handleSubmit}
      />
    </Card>
  );
}
