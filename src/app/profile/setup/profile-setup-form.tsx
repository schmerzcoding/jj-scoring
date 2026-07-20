"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AvatarUpload } from "@/components/avatar-upload";
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
  const [displayName, setDisplayName] = useState(initialValues.fullName);

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
      <div className="mb-6 border-b border-gray-100 pb-6">
        <AvatarUpload
          userId={userId}
          name={displayName || "Dancer"}
          avatarUrl={null}
        />
      </div>

      <ProfileForm
        initialValues={initialValues}
        submitLabel="Save and continue"
        onSubmit={handleSubmit}
        onFullNameChange={setDisplayName}
      />
    </Card>
  );
}
