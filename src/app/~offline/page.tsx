import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <BrandLogo as="h1" className="text-3xl font-bold tracking-tight" />
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold text-foreground">You are offline</h2>
        <p className="text-sm text-muted-foreground">
          Check your connection and try again. Some pages may still work from
          cache once you have visited them online.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-950/40 transition-all hover:bg-brand-500"
      >
        Try again
      </Link>
    </div>
  );
}
