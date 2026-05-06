---
name: Clinical Calm
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fd'
  surface-container: '#ededf8'
  surface-container-high: '#e7e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#434654'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#f0f0fb'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#555f6c'
  on-secondary: '#ffffff'
  secondary-container: '#d9e3f2'
  on-secondary-container: '#5b6572'
  tertiary: '#7b2600'
  on-tertiary: '#ffffff'
  tertiary-container: '#a33500'
  on-tertiary-container: '#ffc6b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#d9e3f2'
  secondary-fixed-dim: '#bdc7d6'
  on-secondary-fixed: '#131c27'
  on-secondary-fixed-variant: '#3e4853'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  subtext-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  edge-margin: 20px
  stack-gap: 16px
  inline-gap: 12px
  section-padding: 24px
---

## Brand & Style

This design system is built on a "Clinical Calm" aesthetic, merging the precision of medical software with the approachability of a high-end wellness application. The brand personality is rooted in reliability and empathy, catering to users who may be experiencing physical or cognitive stress during their recovery journey. 

The design style follows a refined **Minimalism** approach. It utilizes expansive white space to reduce cognitive load and a disciplined color palette to guide the user's attention toward recovery milestones and essential actions. By avoiding heavy ornamentation and focusing on clarity, the interface fosters a sense of professional trustworthiness and orderly progress.

## Colors

The palette is optimized for high legibility and a soothing visual experience. 

- **Primary Blue (#0052CC):** Reserved exclusively for active touchpoints, primary buttons, and meaningful icons to signify "action" and "progress."
- **Secondary Blue (#E6F0FF):** Used for large container backgrounds and selected states. It provides a soft contrast against the white background without the harshness of a dark border.
- **White (#FFFFFF):** The foundational surface color to ensure a sterile, clean, and professional medical environment.
- **Grey-blue (#626F86):** Applied to subtext and captions to create a clear typographic hierarchy, ensuring the most vital information remains dominant while secondary guidance remains accessible.

## Typography

The typography strategy pairs **Manrope** for headings and **Inter** for functional text. Manrope’s geometric yet organic terminals provide a modern, balanced look for titles, while Inter’s utilitarian nature ensures maximum readability for health data and instructions.

Hierarchy is strictly enforced through weight and color. Primary information uses the `text_primary_hex` at 16px-18px, while all descriptive or helper text transitions to `subtext-sm` using the grey-blue palette. Line heights are intentionally generous to accommodate users who may have difficulty focusing.

## Layout & Spacing

This design system utilizes a **Fixed Margin Model** with a dynamic internal layout. A strict 20px margin is maintained on all screen edges to ensure content never feels cramped and is easily tappable on mobile devices.

The internal rhythm is based on an 8px scale. Cards and containers use a standard 16px vertical gap to create a clear "stacking" effect. Content within cards should use 20px padding to mirror the exterior margins, creating a harmonious and predictable visual structure across the entire application.

## Elevation & Depth

To maintain the clean medical aesthetic, this design system avoids heavy drop shadows. Depth is communicated through **Tonal Layering** and **Low-contrast Outlines**.

- **Level 0 (Base):** Pure White (#FFFFFF) background.
- **Level 1 (Cards):** Secondary Blue (#E6F0FF) surfaces or White surfaces with a subtle 1px border (#DFE1E6).
- **Level 2 (Active/Floating):** Use a very soft, highly diffused ambient shadow (0px 4px 20px rgba(0, 82, 204, 0.08)) only for elements that require immediate physical interaction, such as Floating Action Buttons or active modals.

## Shapes

The shape language is defined by a consistent **16px radius** (`rounded-lg` in this system) applied to all primary interface components. This specific curvature is used to evoke a "soft" and "reliable" feel, moving away from the sharp, clinical corners of traditional legacy medical software.

Small elements like tags or badges may use a full "pill" radius, but the 16px standard remains the primary identifier for cards, buttons, and input fields to maintain structural cohesion.

## Components

- **Buttons:** Primary buttons are solid Primary Blue with white text. They use a 16px border radius and a height of 56px to ensure accessibility. Secondary buttons use the Secondary Blue background with Primary Blue text.
- **Cards:** The core of the recovery app. Use Secondary Blue (#E6F0FF) for "Information Cards" and White with a light border for "Interactive Cards." Always apply the 16px corner radius.
- **Input Fields:** Large, 56px height fields with a 16px radius. The border should be grey-blue, turning Primary Blue only when focused.
- **Progress Bars:** Use a thick (8px) track. The background is Secondary Blue and the progress fill is Primary Blue, utilizing rounded caps.
- **Chips/Filters:** Pill-shaped (fully rounded) elements using Secondary Blue for the inactive state and Primary Blue for the active state.
- **Lists:** Clean, edge-to-edge lists within cards. Use 16px padding and a subtle 1px divider to separate recovery tasks or log entries.