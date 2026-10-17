# Fuzzy Note Autocomplete with Frecency Ribbon

## Problem Statement
How might we eliminate mobile typing fatigue, tolerate mobile keyboard typos (e.g., "nadi" -> "nasi"), and avoid manual category selection for recurring expenses without compromising UangKu's sub-3-second logging speed?

## Recommended Direction
Implement a **Horizontal Frecency Suggestion Ribbon** in `SpeedNumpad.vue` backed by an in-memory `fuse.js` index of past transaction notes combined with frecency weighting.

- **Visibility**: The ribbon remains **hidden** until the user types at least 1 character (`noteText.trim().length >= 1`).
- **Typo Tolerance**: Powered by `fuse.js` (Bitap algorithm) so common fat-finger typos on mobile keyboards (e.g., *"nadi padang"* for *"nasi padang"*, *"kpik"* for *"kopi"*) are recognized seamlessly.
- **Frecency Boost**: Fuse match score is combined with note usage frequency and recency.
- **Interaction**: As the user types, top candidate chips appear in a single-row horizontal scroll strip directly above the note input.
- **1-Tap Apply**: Tapping a chip fills the note and auto-selects its remembered category.

## Key Assumptions to Validate
- [ ] Users repeat at least 30-40% of their transaction notes over a month.
- [ ] Auto-selecting the past category upon chip tap feels intuitive and doesn't get in the way.
- [ ] `fuse.js` search execution takes < 2ms on mobile hardware with several hundred transactions.

## MVP Scope
- Install `fuse.js` as a local lightweight dependency.
- In-memory aggregation of unique notes from Dexie: `{ note, category, count, lastUsed }`.
- Hybrid scoring: Fuse typo-tolerant similarity × Frequency boost.
- Horizontal chip strip in `SpeedNumpad.vue`:
  - Strictly hidden until `isNoteFocused` AND `noteText.trim().length >= 1`.
  - Renders top 5 candidate chips with smooth horizontal swipe.
- On chip tap:
  1. Sets `noteText` to chosen note.
  2. Sets `selectedCategory` to its past associated category.
  3. Tactile micro-feedback.

## Not Doing (and Why)
- **Zero-query suggestions on empty focus**: Keeps UI clean and avoids visual jumps before the user actually types.
- **Vertical dropdown menu**: Obstructs the virtual keyboard and category buttons on mobile viewports.
- **Auto-filling amount**: Kept out of scope to avoid accidental incorrect logging.
- **Server-side processing**: 100% offline, local-first in Dexie IndexedDB.
