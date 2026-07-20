"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileSummary } from "@/components/profile-dashboard";
import { ProfileEditModal } from "./profile-edit-modal";
import type { Profile } from "@/types/database";

export function ProfileHeader({
  userId,
  email,
  profile,
}: {
  userId: string;
  email: string;
  profile: Profile;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <ProfileSummary
        fullName={profile.full_name}
        bio={profile.bio}
        danceRole={profile.dance_role}
        age={profile.age}
        gender={profile.gender}
        countryCode={profile.country_code}
        avatarUrl={profile.avatar_url}
        action={
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            Edit profile
          </Button>
        }
      />

      {editOpen && (
        <ProfileEditModal
          userId={userId}
          email={email}
          profile={profile}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
