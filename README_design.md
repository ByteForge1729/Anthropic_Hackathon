# Swayam — Patient Companion

A post-discharge patient companion app prototype. Helps patients track their recovery plan, medications, symptoms, and follow-ups after a hospital visit. Built as a single-page React prototype using inline JSX + Babel — no build step.

> **Status:** design prototype. State is in-memory only; no backend, no auth, no persistence beyond a couple of localStorage tweaks.

---

## Quick start

```bash
# Just serve the folder over HTTP. Any static server works.
python3 -m http.server 8000
# then open http://localhost:8000/app.html
```

The app uses ES modules and Babel-in-the-browser, so opening `app.html` directly via `file://` will fail on CORS for the JSX scripts. Always serve over HTTP.

A pre-bundled, fully offline single-file build also exists: **`Swayam.html`**. Open it directly in any browser — no server needed.

---

## Tech stack

- **React 18** (UMD, pinned via `<script>` tags in `app.html`)
- **Babel Standalone 7.29** — JSX is transpiled in the browser
- No bundler, no npm, no TypeScript. Edit `.jsx` files and refresh.
- Plain CSS variables for theming (light + dark)

This is intentional. The prototype is meant to be hackable in seconds. If you're moving this to production, see [Migrating to a build pipeline](#migrating-to-a-build-pipeline) below.

---

## File map

```
app.html                  Entry point — design tokens, font imports, script tags
app.jsx                   App shell: routing, theme switcher, sidebar, tweaks panel
icons.jsx                 Icon set + brand <Logo> and <Wordmark> components
tweaks-panel.jsx          Floating "Tweaks" UI (color/dark/restart controls)
screens/
  onboarding.jsx          Language pick + discharge upload (2-step flow)
  dashboard.jsx           Home — progress strip + 4 summary cards
  medications.jsx         Med list with dose schedule per plan
  logger.jsx              Symptom logger
  followups.jsx           Appointment list
  share.jsx               Share-with-provider toggle list
  settings.jsx            Profile + privacy + language
  emergency.jsx           Floating SOS button + contacts modal
  plans-store.jsx         In-memory observable store for "plans" (knee, allergies…)
  plan-actions.jsx        Plan tabs + add-medication / add-plan / delete-plan modals
assets/
  swayam-logo.png         Brand wordmark (Devanagari + roman, transparent bg)
Swayam.html               Standalone single-file build (offline-ready)
Swayam Standalone Source.html   Source for the bundler with thumbnail + meta tags
```

---

## App architecture

### Routing

There is no router. `App` (in `app.jsx`) holds three pieces of state:

- `stage` — `"language" | "upload" | "app"` (the onboarding flow)
- `tab` — once in `"app"` stage, which screen is active (`dashboard`, `medications`, etc.)
- `language`, `uploadedFile` — onboarding data, currently not persisted

Tab switching uses a small `<PageTransition>` wrapper for a 160ms cross-fade.

### Plan store (`screens/plans-store.jsx`)

A hand-rolled observable store with a `usePlans()` hook. Holds an array of "plans" (recovery contexts — e.g. *Knee arthroscopy*, *Seasonal allergies*) and an `activeId`. Most screens render the **active** plan only; `PlanTabs` switches between them.

Plan shape:
```js
{
  id, name, condition, source,                  // identifying
  startedDays, totalDays, progressPct,          // progress
  nextDoseTime, nextDoseMed, nextDoseIn,        // dashboard "Next dose" card
  followup: { when, who, inDays, mode },        // appointments
  planTags, planSummary, redFlags,              // overview / symptoms-to-watch
  meds: [{ name, dose, purpose, times: [{ t, s }] }]
}
```

`times[].s` is one of `"done" | "next" | "upcoming"` and `t` is either a `"HH:MM"` string or `"PRN"`.

State mutations (`add`, `remove`, `setActive`) call `notify()` which re-renders subscribers. Mutating nested arrays (e.g. `active.meds = [...]`) is done in place by the dashboard — quick & dirty, would be cleaned up under Redux/Zustand.

### Theming

Two layers:

1. **CSS variables** in `app.html` — base palette, typography, radii, shadows. `:root` defines light; `[data-theme="dark"]` overrides.
2. **JS-driven accent** — `app.jsx` defines an `ACCENTS` object (teal / blue / indigo / forest) and writes `--accent`, `--accent-soft`, `--accent-ink` onto `document.documentElement` whenever the user changes the accent or toggles dark mode.

The default is **Swayam Teal** (`#0E7C7C`), tuned to match the brand wordmark.

#### Dual-tone color system

The design uses a primary teal + secondary amber pairing. Both have light and dark mode variants, all driven via CSS variables in `app.html`:

| Token             | Light     | Dark      | Used for                                      |
|-------------------|-----------|-----------|-----------------------------------------------|
| `--accent`        | `#0E7C7C` | (per-theme via JS) | Primary CTAs, brand, active nav     |
| `--accent-soft`   | `#DBEEEE` | `#0F2A2A` | Tinted backgrounds for active states          |
| `--accent-ink`    | `#0A5C5C` | `#7FD1D1` | Text on `--accent-soft`                       |
| `--accent-2`      | `#C97A2B` | `#F0B070` | Secondary highlights — "Next dose" / amber UI |
| `--accent-2-soft` | `#FBEDD9` | `#3A2614` | Tinted bg                                     |
| `--accent-2-ink`  | `#8F5316` | `#F4C794` | Text on `--accent-2-soft`                     |
| `--danger`        | `#B83232` | (same)    | SOS button, red-flag callouts                 |
| `--ok`            | `#1F8A5B` | (same)    | "Active" / success states                     |

Convention: primary teal for the brand and the *what* (current plan, progress, primary action). Amber for the *when* (next dose, next follow-up) — anything time-pressing.

### Tweaks panel (`tweaks-panel.jsx`)

Self-contained drag-handle floating panel. Currently exposes:
- Accent color picker (4 swatches)
- Dark mode toggle
- "Restart onboarding" / "Skip to app" demo helpers

Persists changes via `postMessage({type: '__edit_mode_set_keys', edits})` to the host (used by the design tool — irrelevant for production). The same panel component supports `<TweakSlider>`, `<TweakSelect>`, `<TweakNumber>`, `<TweakText>`, etc.

### Emergency SOS

`screens/emergency.jsx` renders a fixed-position SOS button and a modal of saved contacts. Always mounted at the App root level.

---

## Design system reference

### Typography

- **Body / UI:** Inter (400, 500, 600, 700) via Google Fonts
- **Mono / metadata:** JetBrains Mono (400, 500) — used for timestamps, file names, step counters, anything that should feel data-like
- Headings: tight letter-spacing (`-0.4` to `-0.6`), weight 600

### Spacing & radii

- Radii: `--radius-sm: 10px`, `--radius: 16px`, `--radius-lg: 22px`
- Cards typically use `padding: 22px` and a 1px border + `--shadow-sm`
- Hover lift: `translateY(-2px)` + `--shadow-md`

### Iconography

All icons live in `icons.jsx` as inline SVG paths. They share a common `<Icon>` wrapper (1.6px stroke, round caps/joins). The brand has two marks:

- `<Icons.Logo>` — square 32×32 SVG, leaf-on-stem motif. Use for favicons / avatars / tight spaces.
- `<Icons.Wordmark>` — full Devanagari + roman wordmark from `assets/swayam-logo.png`. Use the `swayam-wordmark--sidebar` (150px wide) or `swayam-wordmark--hero` (56px tall) classes defined in `app.html`.

---

## Known limitations / TODO for production

This is a prototype — it deliberately stops short in several places that a real product would care about:

- **No persistence.** Refreshing the page resets all state. Wire a real store (server + IndexedDB, or React Query against an API).
- **Auth is hardcoded.** "Jordan Mehta" is a literal in the sidebar profile. Replace with a real user object from your auth provider.
- **The discharge-paper "upload" doesn't parse anything.** It records `{name, size, type}` and that's it. Real implementation needs OCR + an LLM pass to extract meds/schedule/red-flags into the plan shape above.
- **Symptom logger is form-only.** Logged entries aren't stored.
- **Share screen is UI-only.** No PDF generation, no provider integration.
- **i18n is a stub.** Language picker stores a code but no translation layer is wired up. The settings screen reads a `LANG_NAMES` map for display only.
- **"Mark taken" buttons don't update state.**
- **The plan store mutates objects in place** (`active.meds = [...]`). Convert to immutable updates if migrating to Redux/Zustand/Recoil.
- **Babel-in-browser is slow** (~200ms initial transform). Acceptable for prototype, not for production.

### Suggested API surface

If you're hooking this up to a backend, the natural seams are:

```ts
GET    /api/me                       -> User
GET    /api/plans                    -> Plan[]
POST   /api/plans                    (multipart: discharge_paper.pdf) -> Plan
DELETE /api/plans/:id
POST   /api/plans/:id/meds           (med shape from above)
POST   /api/plans/:id/meds/:i/taken  -> { time, status }
POST   /api/symptoms                 (symptom log entry)
POST   /api/share                    -> { url } (PDF + provider link)
```

The frontend `usePlans()` hook is the single integration point — replace its in-memory store with an API client and most screens light up.

---

## Migrating to a build pipeline

If you want to take this to production, the cleanest path is:

1. `npm create vite@latest swayam -- --template react-ts`
2. Copy `screens/`, `app.jsx`, `icons.jsx`, `tweaks-panel.jsx` into `src/`. Rename to `.tsx`, add types.
3. Move CSS variables from `<style>` in `app.html` into `src/index.css`.
4. Replace the manual script tags + Babel with Vite's import graph.
5. Replace the global `window.Icons`, `window.Dashboard`, etc. patterns with real ES module imports. (They exist because Babel-in-browser doesn't share scope across `<script>` tags.)
6. Swap inline-style objects for Tailwind / CSS Modules / styled-components — your call. The current inline-style pattern is verbose but trivial to refactor mechanically.
7. Drop `tweaks-panel.jsx` unless you want to keep an in-product theme picker.

The **design system** (tokens, typography, radii, shadows, dual-tone palette) is the part worth preserving verbatim. Everything else is implementation detail.

---

## Standalone export

`Swayam.html` is a fully self-contained build of the entire app — React, Babel, all JSX, the logo PNG, all screens — inlined into a single ~2 MB HTML file. Open it directly in any browser, no server, no internet. Useful for demos and design reviews.

To rebuild it: edit `Swayam Standalone Source.html` (which is `app.html` plus a `<template id="__bundler_thumbnail">` and a `<meta name="ext-resource-dependency">` lifting the logo) and re-run the bundler.

---

## Brand

- **Name:** Swayam (स्वयम् — Sanskrit for "self" / "by oneself")
- **Tagline:** Patient companion
- **Primary color:** Teal `#0E7C7C`
- **Secondary color:** Amber `#C97A2B`
- **Logo:** `assets/swayam-logo.png` (Devanagari script + roman "yam" + leaf-on-stem motif). The leaf signals natural recovery; the stem-and-bracket form pulls the wordmark together visually.

When in doubt, lean on the wordmark over the square logo. The square logo is a fallback for tight spaces (favicons, 32×32 avatars) — the wordmark is the brand.
