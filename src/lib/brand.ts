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
  waddleCupTrophy: "/branding/copa sin sombra.png",
  homeWaddleCupTitle: "/branding/the waddle cup.png",
  homeSeparator: "/branding/separador.png",
} as const;

export const HOME_HERO = {
  eyebrowBold: "Step",
  eyebrowRest: "into the scene.",
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

export const WADDLE_CUP_LANDING = {
  eyebrow: "Workshops · Competition · Social",
  intro:
    "The Waddle Cup is Waddle Social’s flagship Jack & Jill — a full day of learning, competing, and dancing together in Dublin.",
  pillars: [
    {
      title: "Workshops",
      description:
        "Level up with focused classes before the competition. Open to all pass holders — whether you compete or come to soak up the vibes.",
    },
    {
      title: "Jack & Jill",
      description:
        "Register as leader or follower, dance with random partners across rounds, and let the judges score you individually as you advance.",
    },
    {
      title: "Social",
      description:
        "After the finals, stay for the social — meet the community, practice what you learned, and celebrate the day together.",
    },
  ],
  formatTitle: "How the competition works",
  formatSections: [
    {
      title: "Registration",
      description:
        "Sign up on Waddle Social as a leader or follower. Complete your profile so organizers and judges know who you are on the floor.",
    },
    {
      title: "Rounds",
      description:
        "Each round pairs you with a new partner. Judges score every dancer individually — your result reflects your dancing, not just one couple.",
    },
    {
      title: "Advancement",
      description:
        "Top dancers move from prelims through to the final. Leaderboards update as rounds are published, so you can follow the action live.",
    },
    {
      title: "Finals & celebration",
      description:
        "Finalists dance one last round before awards. Then the floor opens for the social — everyone welcome, competitors or not.",
    },
  ],
  ctaPrimary: "View event & register",
  ctaSecondary: "Browse all events",
} as const;
