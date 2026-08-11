import type { MetadataRoute } from "next";
import { BRAND_NAME } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: "Waddle",
    description:
      "Dance events in Dublin and beyond — socials, workshops, congresses, and competitions.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0e11",
    theme_color: "#0e0e11",
    orientation: "portrait-primary",
    categories: ["entertainment", "social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
