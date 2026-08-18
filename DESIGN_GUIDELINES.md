# StaticGhost — Design System & Anti-Slop Frontend Guidelines

> **Based on:** `design-taste-frontend` anti-slop guidelines  
> **Target Products:** StaticGhost Free Community Edition & StaticGhost Pro / Enterprise  
> **Brand Owner:** Swapp Technologies LLC  

---

## 0. Design Read & Core Dials

**Design Read:**  
*"Reading this as: B2B SaaS product & developer desktop tool for tech creators and agencies, with an anti-slop dark-tech language, leaning toward Tailwind-style utility tokens + Barlow/Inter sans display + SFMono code typography."*

**Core Configuration Dials:**
* **`DESIGN_VARIANCE: 7`** — Asymmetric bento grids & feature cards, clean whitespace offsets, left-aligned headers over structured content.
* **`MOTION_INTENSITY: 6`** — Fluid cubic-bezier transitions, spring-physics micro-interactions (animated GitHub corner ribbon, card hovers), reduced-motion fallbacks.
* **`VISUAL_DENSITY: 4`** — Airy layouts, generous section spacing (`py-16` to `py-24`), `max-w-7xl` containers.

---

## 1. Palette & Typography Rules

### Color Tokens (Swapp Tech Brand Lock)
* **Dark Background**: `#0b0f19` (Zinc / Slate near-black)
* **Card Surface**: `#111827` (Elevated dark slate)
* **Card Border**: `#1f2937` (Subtle 1px border)
* **Primary Brand Accent**: `#00aced` (Swapp Cyan)
* **Secondary Accent**: `#55b4d4` (Soft Sky Cyan)
* **Text Main**: `#f3f4f6` (High contrast off-white, WCAG AA compliant)
* **Text Muted**: `#9ca3af` (Slate muted gray)

### Typography Stack
* **Display / Headlines**: `Barlow`, `Inter`, or `system-ui` sans-serif (`text-4xl md:text-5xl lg:text-6xl`, `font-weight: 700-800`).
* **Body**: `Barlow`, `Inter`, `text-base text-gray-300 leading-relaxed max-w-[65ch]`.
* **Code / Technical Mono**: `SFMono-Regular`, `Consolas`, `JetBrains Mono`.
* **Italic Descender Clearance**: `leading-[1.1]` minimum with `pb-1` clearance for any display italic with `g j p q y`.

---

## 2. Anti-Slop Strict Rules (Non-Negotiable)

1. **ZERO Em-Dashes (`—`)**:
   - Em-dashes are strictly forbidden across headlines, body copy, pills, CTAs, quotes, attribution, captions, and alt text.
   - Use standard hyphens (`-`), commas, colons, or line breaks instead.

2. **Single Theme Lock (Dark Mode)**:
   - The entire application and marketing site uses a single dark mode theme lock (`#0b0f19`).
   - No section flips to light or inverted modes mid-page.

3. **Color & Shape Consistency**:
   - Single accent color (`#00aced`) locked across all buttons, active indicators, and focus rings.
   - Consistent corner radius scale: 12px for cards/modals, 8px for form inputs, full-pill for primary CTAs.

4. **Hero Section Discipline**:
   - Hero fits in initial viewport (`min-h-[100dvh]` or `py-16 lg:py-24`).
   - Headline ≤ 2 lines, subtext ≤ 20 words.
   - Max 4 text elements in hero (Eyebrow/Brand subcaption, Headline, Subtext, CTAs).
   - "Trusted by" logo wall sits strictly **under** the hero, never inside it.

5. **Eyebrow Restraint**:
   - Eyebrows (`uppercase tracking` micro-labels) appear on **at most 1 out of 3 sections**.

6. **CTA & Button Rules**:
   - No wrapped CTA labels on desktop.
   - No duplicate CTA intent (e.g. use "Download Free" for Community and "Upgrade to Pro" for Pro).
   - All button text passes WCAG AA 4.5:1 contrast against backgrounds.

7. **Social Proof Logo Wall**:
   - Real SVG logos (Simple Icons / devicons) only.
   - Logos only — no category/industry text labels underneath logos.

---

## 3. Tier-Specific Design Guidelines (Free vs. Pro / Enterprise)

### 🆓 Free Community Edition UI
* **Visual Style**: Clean, restrained dark-slate card surfaces (`#111827`) with standard 1px borders (`#1f2937`).
* **Badges**: Open-source AGPLv3 badge, single-project profile status.
* **Primary Action**: Slate-blue "Download Free v1.0.0" pill button.

### ⭐ Pro & 🏢 Enterprise Edition UI
* **Visual Style**: Elevated glassmorphic cards with subtle cyan glow borders (`border: 1px solid rgba(0, 172, 237, 0.4)`).
* **Badges**: Glassmorphic cyan "RECOMMENDED / PRO" pill badges (`background: rgba(0, 172, 237, 0.15)`).
* **Primary Action**: High-contrast Swapp Cyan CTA button (`background: #00aced`, `color: #000`, `font-weight: 700`).
* **Feature Matrix**: Visual feature indicators (Multi-Cloud Deploy, Cloudflare Tunnel, Scheduled Auto-Exports, Agency Sub-Profiles).
