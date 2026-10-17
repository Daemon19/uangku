# Rich Category Cards + Scaled Numpad (Tall Viewport Polish)

## Problem Statement
How might we gracefully eliminate awkward vertical dead space on tall mobile displays by transforming cramped category pills and fixed-height numpad keys into generous, tactile, thumb-friendly touch targets?

## Recommended Direction
**Rich Category Cards + Scaled Numpad:**
On taller viewports (or when vertical space is abundant), transition category buttons from horizontally cramped pills into rich vertical cards (Category Icon centered or stacked neatly above the label with generous padding) and allow the numpad keys to scale up smoothly (from ~46px up to ~72px–80px). 

On compact screens (e.g. `< 700px` height), maintain the existing compact horizontal pill layout to guarantee zero-scroll above-the-fold logging.

### Why This Direction?
1. **Solves Truncation & Touch Target Ergonomics:** Category names like "Transportasi" and "Kesehatan" often felt tight in 3-column horizontal pills. Giving them vertical breathing room on tall screens creates a premium, tactile calculator feel.
2. **Eliminates Dead Void without Feature Creep:** Consumes vertical space purely by improving usability of the primary entry flow, respecting UangKu's non-negotiable sub-3-second rule.
3. **Adaptive Continuum:** Compact screens get the space-saving compact rows; tall screens get generous cards.

---

## Key Assumptions to Validate
- [ ] Category buttons look balanced when stacked (icon above label) on medium-to-tall heights without feeling too bulky.
- [ ] Numpad key heights scale naturally using CSS flex/grid or `clamp(42px, ..., 80px)` with sensible maximums so they don't look clownishly tall.
- [ ] Transitions between compact viewports (landscape/small phones) and tall screens remain seamless.

---

## MVP Scope

### What's In:
1. **Dynamic Category Layout:**
   - Default / Tall screens: `flex flex-col items-center justify-center p-2.5 sm:p-3` with icon stacked above text, text centered.
   - Compact screens (`@media (max-height: 700px)`): horizontal compact alignment (`flex-row items-center gap-1.5 p-1.5`) preserved.
2. **Proportional Numpad Scaling:**
   - Allow numpad keys to expand: `height: clamp(42px, 8.5dvh, 76px)` on taller viewports, keeping the 4-row grid stretched to fill available lower space.
   - Enter key (`CornerDownLeft`) spans the 2 rows with proportional height.
3. **Container Flex Distribution:**
   - Allow the middle/category section and numpad to share the vertical slack cleanly with `justify-between` and flex distribution.

### What's Out (Not Doing & Why):
- **Not adding new widgets/charts to the input pane:** Keeps the input flow 100% focused on rapid expense logging.
- **Not adding more than 9 categories in the primary grid:** Preserves the 3x3 direct-log grid hierarchy.
- **Not breaking keyboard focus behavior:** When note input is focused, numpad cleanly hides as before.

---

## Open Questions / Clarifications
- Maximum key height ceiling: ~76px is recommended to prevent excessive button height on tablets or ultra-tall desktop windows.
