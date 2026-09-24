"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { getCroppedImageBlob } from "@/lib/crop-image";

export function AvatarCropModal({
  imageSrc,
  onCancel,
  onConfirm,
}: {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onCancel();
    }

    document.addEventListener("keydown", handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel, saving]);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels || saving) return;

    setSaving(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      await onConfirm(blob);
    } catch {
      alert("Could not prepare your photo. Please try again.");
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="avatar-crop-modal"
      onClick={saving ? undefined : onCancel}
    >
      <div
        className="avatar-crop-modal__panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
      >
        <div className="avatar-crop-modal__header">
          <div>
            <h2 id="avatar-crop-title" className="text-lg font-semibold text-foreground">
              Adjust photo
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Pinch or use the slider to zoom. Drag to reposition.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="avatar-crop-modal__cropper">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="avatar-crop-modal__controls">
          <label htmlFor="avatar-crop-zoom" className="text-sm font-medium text-muted-foreground">
            Zoom
          </label>
          <input
            id="avatar-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="avatar-crop-modal__zoom"
          />
        </div>

        <div className="avatar-crop-modal__actions">
          <Button
            type="button"
            variant="secondary"
            className="ui-btn--cancel min-w-0 flex-1"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="min-w-0 flex-1"
            onClick={() => void handleSave()}
            loading={saving}
            disabled={!croppedAreaPixels}
          >
            {saving ? "Saving..." : "Save photo"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
