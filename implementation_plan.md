# Ultra-Premium Landing Page Overhaul

# Goal Description
Elevate the landing page UI/UX to a "Galactic Luxury" standard, exceeding Apple's design ecosystem. This involves a complete redesign of the `Landing`, `LandingNavbar`, and `Logo` components, focusing on minimalism, fluid animations, and high-end visual effects.

## User Review Required
> [!IMPORTANT]
> This is a total redesign. The new aesthetic will be "Galactic Luxury" - darker, cleaner, and more animated than before.

## Proposed Changes

### Styling
#### [MODIFY] [tailwind.config.js](file:///c:/Users/test/OneDrive/Desktop/COLABMATCH/frontend/tailwind.config.js)
- Add "Apple-esque" font stack (SF Pro display equivalents).
- Add new animation utilities (spotlight, magnetic).

### Components
#### [MODIFY] [Logo.tsx](file:///c:/Users/test/OneDrive/Desktop/COLABMATCH/frontend/src/components/Logo.tsx)
- Redesign to be a pure, geometric, architectural symbol.
- Remove "ALLIV" text for a cleaner look (or make it optional/fade in).

#### [MODIFY] [LandingNavbar.tsx](file:///c:/Users/test/OneDrive/Desktop/COLABMATCH/frontend/src/components/LandingNavbar.tsx)
- **Dynamic Island Style**: Floating glass pill on scroll.
- **Minimalist**: Only essential links, high-contrast typography.

#### [MODIFY] [Landing.tsx](file:///c:/Users/test/OneDrive/Desktop/COLABMATCH/frontend/src/routes/Landing.tsx)
- **Hero**: "Cinematic" entrance. Large, centered typography with a subtle, shifting nebula background.
- **Bento Grid**: Feature section using a highly polished grid layout with tilt effects.
- **Scrollytelling**: Elements reveal themselves with "fade-up" and "scale-in" animations linked to scroll.
- **Typography**: Tracking-tight, high-contrast, "editorial" feel.

## Verification Plan
### Manual Verification
- Check the "Dynamic Island" navbar behavior on scroll.
- Verify the smoothness of the hero animation.
- Test the "Bento Grid" interactivity.
