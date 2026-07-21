import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  title: BRAND_NAME,
  description: "Dance events in Dublin and beyond — socials, workshops, congresses, and competitions.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} app-glow`}>
        <Navbar />
        <main className="animate-fade-in mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
