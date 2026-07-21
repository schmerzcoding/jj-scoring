"use client";

import Link from "next/link";
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
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              Edit profile
            </Button>
            <Link href="/profile/change-password">
              <Button variant="ghost" size="sm">
                Change password
              </Button>
            </Link>
          </div>
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
