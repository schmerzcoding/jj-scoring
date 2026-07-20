"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarUpload } from "@/components/avatar-upload";
import { ProfileForm, saveProfileValues } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { profileToFormValues } from "@/lib/profile";
import type { Profile } from "@/types/database";

export function ProfileEditModal({
  userId,
  email,
  profile,
  onClose,
}: {
  userId: string;
  email: string;
  profile: Profile;
  onClose: () => void;
}) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [displayName, setDisplayName] = useState(profile.full_name);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-overlay shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-surface-overlay px-6 py-4">
          <div>
            <h2 id="profile-edit-title" className="text-lg font-semibold text-foreground">
              Edit profile
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Email: <span className="text-foreground">{email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <AvatarUpload
            userId={userId}
            name={displayName}
            avatarUrl={avatarUrl}
            onUploaded={(url) => {
              setAvatarUrl(url);
              router.refresh();
            }}
          />

          <ProfileForm
            initialValues={profileToFormValues(profile)}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              setDisplayName(values.fullName);
              const result = await saveProfileValues(userId, values, true);
              if (!result.error) {
                router.refresh();
                onClose();
              }
              return result;
            }}
          />
        </div>

        <div className="border-t border-border px-6 py-4">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
