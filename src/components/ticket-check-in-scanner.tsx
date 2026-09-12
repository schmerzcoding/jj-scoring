"use client";

import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const READER_ID = "ticket-qr-reader";

async function waitForReaderMount(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function pickRearCameraId(
  cameras: { id: string; label: string }[]
): string | { facingMode: string } {
  if (cameras.length === 0) {
    return { facingMode: "environment" };
  }

  const rearCamera = cameras.find((camera) =>
    /back|rear|environment|trás|trasera/i.test(camera.label)
  );

  return rearCamera?.id ?? cameras[cameras.length - 1]?.id ?? cameras[0].id;
}

type VerifyResult = {
  attendeeName: string;
  passTypeLabel: string;
  eventName: string;
  alreadyCheckedIn: boolean;
  checkedInAt: string;
};

export function TicketCheckInScanner({
  competitionId,
  eventName,
}: {
  competitionId: string;
  eventName: string;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef("");
  const [scanning, setScanning] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [cameraError, setCameraError] = useState("");

  async function verifyToken(token: string) {
    const trimmed = token.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: trimmed, competitionId }),
      });

      const data = (await response.json()) as VerifyResult & { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not verify ticket.");
        setLoading(false);
        return;
      }

      setResult(data);
    } catch {
      setError("Could not verify ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function startScanner() {
    setCameraError("");
    setError("");
    setResult(null);
    setStartingCamera(true);

    if (scannerRef.current) {
      await stopScanner();
    }

    // The reader must be visible with dimensions before the camera starts (iOS Safari).
    setScanning(true);
    await waitForReaderMount();

    const scanner = new Html5Qrcode(READER_ID, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;

    try {
      const cameras = await Html5Qrcode.getCameras();
      const cameraId = pickRearCameraId(cameras);
      const qrboxSize = Math.min(280, Math.max(200, window.innerWidth - 96));

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (decodedText === lastScanRef.current) return;
          lastScanRef.current = decodedText;
          void verifyToken(decodedText);
        },
        () => {
          // ignore scan failures between frames
        }
      );
    } catch {
      setScanning(false);
      setCameraError(
        "Could not access the camera. Use manual entry or check browser permissions."
      );
      scannerRef.current = null;
    } finally {
      setStartingCamera(false);
    }
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) {
      setScanning(false);
      setStartingCamera(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // ignore cleanup errors
    }

    scannerRef.current = null;
    lastScanRef.current = "";
    setScanning(false);
    setStartingCamera(false);
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
        <h2 className="text-lg font-semibold text-foreground">Scan tickets</h2>
        <p className="mt-1 text-sm text-muted">
          Scan a guest QR code for {eventName}. You will see their name and pass type.
        </p>

        <div
          id={READER_ID}
          className={`ticket-qr-reader mt-4 w-full overflow-hidden rounded-xl bg-black ${
            scanning ? "min-h-[300px]" : "hidden"
          }`}
        />

        {startingCamera && (
          <p className="mt-4 text-sm text-muted">Starting camera…</p>
        )}

        {cameraError && (
          <p className="mt-4 text-sm text-red-400">{cameraError}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {!scanning ? (
            <Button
              type="button"
              loading={startingCamera}
              onClick={() => void startScanner()}
            >
              Start camera
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void stopScanner()}
            >
              Stop camera
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
        <h3 className="font-semibold text-foreground">Manual entry</h3>
        <p className="mt-1 text-sm text-muted">
          Paste the ticket token if the camera is unavailable.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void verifyToken(manualToken);
          }}
        >
          <Input
            label="Ticket token"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Scan or paste token"
          />
          <Button type="submit" loading={loading} variant="secondary">
            Verify
          </Button>
        </form>
      </div>

      {error && (
        <div className="alert-banner alert-banner-muted">{error}</div>
      )}

      {result && (
        <div
          className={`rounded-2xl border p-6 shadow-lg shadow-black/20 ${
            result.alreadyCheckedIn
              ? "border-amber-700/50 bg-amber-950/40"
              : "border-emerald-700/50 bg-emerald-950/40"
          }`}
        >
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              result.alreadyCheckedIn ? "text-amber-300" : "text-emerald-300"
            }`}
          >
            {result.alreadyCheckedIn ? "Already checked in" : "Check-in successful"}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {result.attendeeName}
          </p>
          <p className="mt-1 text-sm text-muted">{result.passTypeLabel}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {result.eventName}
          </p>
        </div>
      )}
    </div>
  );
}
