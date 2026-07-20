"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AvatarUpload } from "@/components/avatar-upload";
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
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [displayName, setDisplayName] = useState(profile.full_name);

  return (
    <Card title="Your profile" description="Update your dancer information">
      <p className="mb-4 text-sm text-muted">
        Email: <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="mb-6 border-b border-border pb-6">
        <AvatarUpload
          userId={userId}
          name={displayName}
          avatarUrl={avatarUrl}
          onUploaded={(url) => {
            setAvatarUrl(url);
            router.refresh();
          }}
        />
      </div>

      <ProfileForm
        initialValues={profileToFormValues(profile)}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          setDisplayName(values.fullName);
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
