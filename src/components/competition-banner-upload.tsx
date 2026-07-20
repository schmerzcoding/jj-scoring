"use client";

import { createClient, fromTable } from "@/lib/supabase/client";

const MAX_BANNER_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadCompetitionBanner(
  competitionId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Please choose a JPEG, PNG, or WebP image." };
  }

  if (file.size > MAX_BANNER_BYTES) {
    return { error: "Banner must be 5 MB or smaller." };
  }

  const supabase = createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filePath = `${competitionId}/banner.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("competition-banners")
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("competition-banners").getPublicUrl(filePath);

  const bannerUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await fromTable(supabase, "competitions")
    .update({ banner_url: bannerUrl })
    .eq("id", competitionId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { url: bannerUrl };
}

export function CompetitionBannerUpload({
  competitionId,
  bannerUrl,
  onUploaded,
}: {
  competitionId?: string;
  bannerUrl?: string | null;
  onUploaded?: (url: string) => void;
  onFileSelected?: (file: File | null) => void;
}) {
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!competitionId) {
      alert("Save the competition first, then upload a banner.");
      e.target.value = "";
      return;
    }

    const result = await uploadCompetitionBanner(competitionId, file);
    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.url) {
      onUploaded?.(result.url);
    }

    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt="Competition banner preview"
            className="aspect-[3/1] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[3/1] items-center justify-center text-sm text-muted-foreground">
            No banner uploaded
          </div>
        )}
      </div>
      <label className="inline-flex cursor-pointer rounded-xl border border-border bg-surface-overlay px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-700/50 hover:bg-surface-hover">
        Upload banner
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
      </label>
      <p className="text-xs text-muted">
        Recommended wide image (JPEG, PNG, WebP). Max 5 MB.
      </p>
    </div>
  );
}
