"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [scanning, setScanning] = useState(false);
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

    if (scannerRef.current) {
      await stopScanner();
    }

    const scanner = new Html5Qrcode("ticket-qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          void verifyToken(decodedText);
        },
        () => {
          // ignore scan failures between frames
        }
      );
      setScanning(true);
    } catch {
      setCameraError(
        "Could not access the camera. Use manual entry or check browser permissions."
      );
      scannerRef.current = null;
    }
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // ignore cleanup errors
    }

    scannerRef.current = null;
    setScanning(false);
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
          id="ticket-qr-reader"
          className={`mt-4 overflow-hidden rounded-xl ${scanning ? "block" : "hidden"}`}
        />

        {cameraError && (
          <p className="mt-4 text-sm text-red-400">{cameraError}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {!scanning ? (
            <Button type="button" onClick={() => void startScanner()}>
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
