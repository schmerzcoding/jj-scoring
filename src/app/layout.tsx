import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const APP_DESCRIPTION =
  "Dance events in Dublin and beyond — socials, workshops, congresses, and competitions.";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  applicationName: BRAND_NAME,
  title: {
    default: BRAND_NAME,
    template: `%s · ${BRAND_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    title: BRAND_NAME,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: BRAND_NAME,
    description: APP_DESCRIPTION,
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0e11",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} app-glow flex min-h-screen flex-col`}>
        <Navbar />
        <main className="animate-fade-in mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
