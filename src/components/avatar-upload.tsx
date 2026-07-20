"use client";

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

  const className = `${sizeClasses[size]} shrink-0 overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700`;

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
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      alert("Image must be 2 MB or smaller.");
      return;
    }

    const { createClient, fromTable } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${userId}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
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

    if (profileError) {
      alert(`Could not save profile photo: ${profileError.message}`);
      return;
    }

    onUploaded?.(cacheBustedUrl);
    e.target.value = "";
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
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <UserAvatar name={name} avatarUrl={avatarUrl} size="lg" />
      <div className="space-y-2">
        <label className="inline-flex cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Upload photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleChange}
          />
        </label>
        {avatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="block text-sm text-red-600 hover:underline"
          >
            Remove photo
          </button>
        )}
        <p className="text-xs text-gray-500">JPEG, PNG, WebP or GIF. Max 2 MB.</p>
      </div>
    </div>
  );
}
