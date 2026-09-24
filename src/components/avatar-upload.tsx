"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarCropModal } from "@/components/avatar-crop-modal";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-16 w-16 text-lg",
    lg: "h-24 w-24 text-2xl",
  };

  const className = `${sizeClasses[size]} shrink-0 overflow-hidden rounded-full bg-brand-950 font-semibold text-brand-300 ring-2 ring-brand-800/50`;

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center`}>
      {initials(name) || "?"}
    </div>
  );
}

export function AvatarUpload({
  userId,
  name,
  avatarUrl,
  onUploaded,
}: {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  onUploaded?: (url: string | null) => void;
}) {
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const cropImageSrcRef = useRef<string | null>(null);

  useEffect(() => {
    cropImageSrcRef.current = cropImageSrc;
  }, [cropImageSrc]);

  useEffect(() => {
    return () => {
      if (cropImageSrcRef.current) {
        URL.revokeObjectURL(cropImageSrcRef.current);
      }
    };
  }, []);

  function clearCropImage() {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      alert("Image must be 2 MB or smaller.");
      return;
    }

    clearCropImage();
    setCropImageSrc(URL.createObjectURL(file));
  }

  async function uploadAvatarBlob(blob: Blob) {
    if (blob.size > MAX_AVATAR_BYTES) {
      alert("Cropped image must be 2 MB or smaller. Try zooming out a little.");
      return;
    }

    setUploading(true);

    const { createClient, fromTable } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const filePath = `${userId}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });

    if (uploadError) {
      setUploading(false);
      alert(`Upload failed: ${uploadError.message}`);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: profileError } = await fromTable(supabase, "profiles")
      .update({ avatar_url: cacheBustedUrl })
      .eq("id", userId);

    setUploading(false);

    if (profileError) {
      alert(`Could not save profile photo: ${profileError.message}`);
      return;
    }

    clearCropImage();
    onUploaded?.(cacheBustedUrl);
  }

  async function handleRemove() {
    const { createClient, fromTable } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data: files } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (files?.length) {
      await supabase.storage
        .from("avatars")
        .remove(files.map((file) => `${userId}/${file.name}`));
    }

    await fromTable(supabase, "profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    onUploaded?.(null);
  }

  return (
    <>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <UserAvatar name={name} avatarUrl={avatarUrl} size="lg" />
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer rounded-xl border border-border bg-surface-overlay px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-700/50 hover:bg-surface-hover">
            {uploading ? "Uploading..." : "Upload photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={handleFileSelect}
            />
          </label>
          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="block text-sm text-red-400 hover:text-red-300 hover:underline disabled:opacity-50"
            >
              Remove photo
            </button>
          )}
          <p className="text-xs text-muted">
            JPEG, PNG, WebP or GIF. Max 2 MB. You can reposition before saving.
          </p>
        </div>
      </div>

      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onCancel={clearCropImage}
          onConfirm={uploadAvatarBlob}
        />
      )}
    </>
  );
}
