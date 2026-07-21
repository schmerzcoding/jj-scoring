# Design system — Waddle Social

Step-by-step visual identity for the app. Dark elegant theme with wine/burgundy accents.

## Palette

| Token | Hex | Usage |
|-------|-----|--------|
| `brand-500` | `#b8304f` | Primary accent, links hover |
| `brand-600` | `#9a2842` | Buttons, CTAs |
| `brand-950` | `#3d0f19` | Avatar rings, deep accents |
| `surface` | `#0c0c0f` | Page background |
| `surface-overlay` | `#16161c` | Cards, modals, inputs |
| `surface-raised` | `#121216` | Navbar, elevated bars |
| `border` | `#2a2a32` | Card and input borders |
| `foreground` | `#f4f4f6` | Primary text |
| `muted` | `#9ca3af` | Secondary text |

## Typography

- **Font:** Inter (via `layout.tsx`)
- **Headings:** bold, tight tracking; accent `&` in brand color on hero/logo

## Components (Step 1 — done)

- **Buttons:** `rounded-xl`, brand shadow, variants in `ui/button.tsx`
- **Cards:** dark overlay, subtle border, hover border tint
- **Navbar:** sticky, blurred, burgundy logo accent
- **Background:** `.app-glow` radial gradients on body

## Step 2 — done

- **Auth:** login, signup, verify-email (Card + dark form feedback)
- **Profile:** summary header, dashboard sections, achievements, edit/setup forms
- **Competition detail:** banner hero, rounds, registration, leaderboards

## Step 3 — done

- **Admin:** dashboard, competition detail, new competition form, panels (registrations, rounds, judges, settings, branding)
- **Judge:** dashboard, scoring panel with Yes/No toggle, round chips, leaderboards
- **Danger zone:** dark red warning styling

## Step 4 — done

- **EmptyState** component with icons for lists, panels, and cards
- **Spinner** + `loading` prop on Button (forms, scoring, admin actions)
- **Success variant** on save buttons in scoring panel
- **Page fade-in** on main content; **stagger** on card grids
- **Reduced motion** respected via `prefers-reduced-motion`
