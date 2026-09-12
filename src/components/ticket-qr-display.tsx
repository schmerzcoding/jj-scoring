"use client";

import QRCode from "react-qr-code";

export function TicketQrDisplay({
  token,
  size = 200,
}: {
  token: string;
  size?: number;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-border bg-white p-4 shadow-lg shadow-black/30">
      <QRCode
        value={token}
        size={size}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
      />
    </div>
  );
}
