"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  ProfileForm,
  saveProfileValues,
} from "@/components/profile-form";
import { profileToFormValues } from "@/lib/profile";
import type { Profile } from "@/types/database";

export function ProfileEditForm({
  userId,
  email,
  profile,
}: {
  userId: string;
  email: string;
  profile: Profile;
}) {
  const router = useRouter();

  return (
    <Card title="Your profile" description="Update your dancer information">
      <p className="mb-4 text-sm text-gray-500">
        Email: <span className="font-medium text-gray-700">{email}</span>
      </p>

      <ProfileForm
        initialValues={profileToFormValues(profile)}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          const result = await saveProfileValues(userId, values, true);
          if (!result.error) {
            router.refresh();
          }
          return result;
        }}
      />
    </Card>
  );
}
