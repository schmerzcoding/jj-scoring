export const BRAND_NAME = "Waddle Social";
export const BRAND_DOMAIN = "waddlesocial.com";
export const BRAND_URL = `https://www.${BRAND_DOMAIN}`;
export const BRAND_INSTAGRAM_URL = "https://www.instagram.com/waddlesocial";

/** Official palette — only these four colors sitewide */
export const BRAND_COLORS = {
  black: "#000000",
  purpleDark: "#30004e",
  purple: "#8115d7",
  white: "#ffffff",
} as const;

export const BRAND_ASSETS = {
  appIcon: "/branding/app-icon.png",
  logoHorizontal: "/branding/logo-horizontal.png",
  logoHorizontalWhite: "/branding/logo-horizontal-white.png",
  logoMark: "/branding/logo-mark.png",
  pageBackground: "/branding/page-background.png",
  /** Homepage — designer exports (Dani) */
  homeTitleWaddle: "/branding/titulo waddle.png",
  homeCrystalIcon: "/branding/icono cristal.png",
  homeTrophyShadow: "/branding/copa con sombra.png",
  homeWaddleCupTitle: "/branding/the waddle cup.png",
} as const;

export const HOME_HERO = {
  eyebrow: "Step into the scene.",
  description:
    "Discover events, sell tickets, and run competitions with our integrated judging system.",
  descriptionHighlight: "Dublin and beyond.",
} as const;

export const HOME_FEATURE_EVENT = {
  eyebrow: "Featured Event",
  tagline: "Workshops • Competition • Social",
  dateLocationPrefix: "November 28th, 2026 - ",
  dateLocationHighlight: "Dublin",
  dateLocationSuffix: ", Ireland.",
} as const;
