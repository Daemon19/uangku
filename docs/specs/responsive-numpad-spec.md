# Specification: Viewport-Adaptive Speed Numpad & Quick-Entry Flow

- **Document Version:** 1.0.0
- **Status:** Draft / Proposed
- **Author:** Antigravity Pair Programmer
- **Target Component:** `src/components/SpeedNumpad.vue` & `src/components/ControlCenter.vue`

---

## 1. Context & Motivation

UangKu's primary product proposition is **sub-3-second expense logging**. Currently, opening the quick-entry pane (`ControlCenter.vue` displaying `SpeedNumpad.vue`) on compact viewports (such as the iPhone SE / 667px height, small Android devices, or mobile browsers with expanded address/navigation bars) causes vertical overflow. 

This triggers a scrollbar on the entry modal, forcing users to scroll up/down to see the amount display, category pills, or bottom rows of the numpad. This violates the sub-3-second rule and degrades mobile ergonomics.

---

## 2. Goals & Non-Goals

### Goals
1. **Fit Entirely Above the Fold:** On viewports with heights down to ~600px (e.g. 375x667 with browser chrome), the entire entry interface (Header + Amount/Note Display + Category Matrix + 12-key Numpad) must fit strictly within `100dvh` without any vertical scrollbar.
2. **Accessible Tap Targets:** Preserve a minimum interactive tap target height of ≥ 40px – 44px even on ultra-compact screens.
3. **Smooth Fluid Scaling:** Utilize dynamic viewport height (`dvh`) and container/media query thresholds to proportionally shrink margins, paddings, gaps, and button heights rather than clipping or abruptly breaking layouts.
4. **Maintain Desktop Ergonomics:** Ensure the desktop view (centered `max-w-md`) continues to render comfortable standard heights (~58px–66px key heights).

### Non-Goals
- Changing the 12-key numpad layout or key positions.
- Modifying the payment toggle, fuzzy note suggestion ribbon behavior, or direct-log category trigger flow.
- Introducing multi-step wizards or secondary confirmation sheets.

---

## 3. Viewport Budget & Height Breakdown

On a compact mobile viewport of height **667px** (dynamic viewport `100dvh`):
- Modal Top Header (Close button & Mode switch): ~**48px**
- Container Padding (`p-2.5` to `p-3.5` top/bottom): ~**20px - 28px**
- Top Static Card (Amount preview + Note input + Suggestions ribbon): ~**150px - 165px**
- Category Grid (2 rows x 3 cols): ~**80px - 90px**
- Spacing / Gaps: ~**16px - 24px**
- **Remaining for Numpad Grid (4 rows):** ~**240px - 270px**
  - Target per numpad row: ~**44px - 52px** (comfortably above the 40px–44px minimum tap target guidelines).

---

## 4. Technical Strategy

### A. Dynamic Viewport & Flex Container Architecture
In `ControlCenter.vue`:
- Ensure the modal outer wrapper uses `h-[100dvh]` or `max-h-[100dvh]` with `overflow-hidden` so that iOS dynamic toolbars (Safari address bar / keyboard bars) correctly resize the available space without shifting content offscreen.

In `SpeedNumpad.vue`:
- Replace fixed pixel button heights (`h-[58px] sm:h-[66px]`) with responsive heights leveraging CSS `@media (max-height: ...)` or viewport-clamped height units.
- Specifically:
  ```css
  /* Key height tiers */
  /* Default / Short Viewport (< 680px or < 720px height) */
  min-h-[42px] h-[clamp(42px,7.5dvh,60px)]
  ```
- Make row and section gaps dynamic:
  - Top section gap: `gap-1.5 sm:gap-2.5`
  - Numpad grid gap: `gap-1 sm:gap-1.5 md:gap-2`
  - Container padding: `p-2.5 sm:p-3.5`

### B. Element-by-Element Scaling Specification

| Section / Element | Standard (> 720px) | Compact (620px - 720px) | Ultra-Compact (< 620px) |
| :--- | :--- | :--- | :--- |
| **Top Padding** | `p-3.5 sm:p-4` | `p-2.5` | `p-2` |
| **Amount Card Padding** | `p-3 sm:p-3.5` | `p-2` | `p-1.5` |
| **Amount Text Size** | `text-3xl sm:text-4xl` | `text-2xl sm:text-3xl` | `text-xl` |
| **Note Input Box** | `py-2 px-3` | `py-1.5 px-3` | `py-1 px-2.5 text-sm` |
| **Note Ribbon Slot** | `h-[40px]` | `h-[34px]` | `h-[30px]` |
| **Category Button** | `p-2 sm:p-2.5` | `p-1.5` | `p-1` |
| **Category Icon Box** | `w-7 h-7 sm:w-8 sm:h-8` | `w-6 h-6` (Icon: 14px) | `w-5 h-5` (Icon: 12px) |
| **Numpad Key Height** | `h-[58px] sm:h-[66px]` | `h-[46px] - h-[50px]` | `h-[40px] - h-[44px]` |
| **Numpad Enter Span** | `min-h-[124px]` | `min-h-[96px]` | `min-h-[84px]` |
| **Key Font Size** | `text-xl sm:text-2xl` | `text-lg sm:text-xl` | `text-base` |

### C. CSS Media Query Strategy
Tailwind height media queries can be cleanly targeted via custom utilities or standard height breakpoint queries in CSS or scoped styles, e.g.:
```css
@media (max-height: 700px) {
  /* Compact overrides */
}
@media (max-height: 600px) {
  /* Extreme compact fallback */
}
```
Or utilizing dynamic `dvh` with `clamp()` in Tailwind utility classes:
- `h-[clamp(42px,6.8dvh,62px)]`

---

## 5. Verification & Testing Criteria

1. **Height Boundaries:**
   - Test at viewport heights: 600px, 667px (iPhone SE), 740px, 844px (iPhone 12/13/14), and 920px (Desktop).
   - Verify `scrollHeight === clientHeight` (zero vertical scrollbar on the modal view).
2. **Usability & Tap Targets:**
   - All buttons have minimum height ≥ 40px.
   - Pointer events trigger reliably on mobile touch (`@pointerdown` + `@click` debounce preserved).
3. **Regression Testing:**
   - Run `npm run typecheck` to verify strict Vue 3 / TypeScript adherence.
   - Run `npm run test` to ensure 100% Vitest suites pass.
