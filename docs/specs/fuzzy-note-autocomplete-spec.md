# Implementation Spec: Fuzzy Note Autocomplete with Frecency Ribbon

- **Feature**: Typo-tolerant past note suggestions via horizontal touch ribbon in `SpeedNumpad.vue`.
- **Status**: Ready for Implementation
- **Target Files**:
  - `package.json` (add `fuse.js` dependency)
  - `src/utils/fuzzyNotes.ts` (new core utility)
  - `src/utils/fuzzyNotes.test.ts` (new Vitest unit tests)
  - `src/components/SpeedNumpad.vue` (UI component integration)

---

## 1. Architectural Overview & Data Flow

```
[Dexie Transactions Store]
           │
           ▼ (useLiveQuery / reactive cache)
[Unique Past Notes Aggregator] 
  - Groups unique notes (case-insensitive)
  - Computes count & lastUsed timestamp
           │
           ▼
[Input Event: noteText.value changes (length >= 1)]
           │
           ▼
[rankPastNotes(query, notesList, limit = 5)]
  - Fuse.js Bitap matching (threshold 0.4, distance 100)
  - Frecency weighting: score = (1 - fuseScore) * ln(1 + count) * recencyDecay
           │
           ▼
[Horizontal Suggestion Ribbon] in SpeedNumpad.vue
  - Hidden when query is empty or 0 matches
  - On Chip Tap (@pointerdown.prevent):
      1. noteText.value = selectedNote
      2. Keep input focused via noteInputRef.value.focus()
      3. Set cursor at end via setSelectionRange()
      4. Category remains untouched
```

---

## 2. Dependencies

Add `fuse.js` to `dependencies` in `package.json`:
```bash
npm install fuse.js
```
- Package size: ~4.5KB gzipped.
- Offline-only, zero network requests, zero browser security/DOM overhead.

---

## 3. Core Engine: `src/utils/fuzzyNotes.ts`

### Types & Interfaces

```typescript
export interface NoteStat {
  text: string;           // Display text (original casing of most recent occurrence)
  normalized: string;     // Lowercased text for grouping
  count: number;          // Total historical occurrences
  lastTimestamp: number;  // Epoch ms of most recent transaction
}

export interface ScoredNote {
  text: string;
  score: number;
}
```

### Functions

#### `extractUniqueNotes(transactions: Array<{ note?: string; timestamp?: string }>): NoteStat[]`
- Iterates over transactions.
- Ignores transactions without a note or with empty/whitespace-only notes.
- Deduplicates notes case-insensitively while preserving the casing of the most recent entry.
- Returns an array of `NoteStat`.

#### `rankPastNotes(query: string, notes: NoteStat[], limit = 5): string[]`
- Guard clause: if `!query.trim()`, returns `[]`.
- Instantiates / uses `Fuse` with options:
  ```typescript
  {
    keys: ['text'],
    threshold: 0.4,       // Balances typo tolerance (e.g. "nadi" -> "nasi") without wild false positives
    distance: 100,
    includeScore: true,
  }
  ```
- Post-processes Fuse results with frecency:
  $$\text{frecencyMultiplier} = \ln(1 + \text{count}) \times \max\left(0.5, 1 - \frac{\text{ageInDays}}{60}\right)$$
  $$\text{finalScore} = (1 - \text{fuseScore}) \times \text{frecencyMultiplier}$$
- Sorts descending by `finalScore`.
- Slices top `limit` results (default: 5).
- Returns array of note strings.

---

## 4. UI Component Integration: `src/components/SpeedNumpad.vue`

### Reactive State
- Import `extractUniqueNotes` and `rankPastNotes` from `@/utils/fuzzyNotes`.
- Compute cached note statistics from `allTransactions`:
  ```typescript
  const pastNotes = computed(() => extractUniqueNotes(allTransactions.value));
  const suggestedNotes = computed(() => {
    if (!isNoteFocused.value || !noteText.value.trim()) return [];
    return rankPastNotes(noteText.value, pastNotes.value, 6);
  });
  ```

### DOM Structure & Ergonomics
Place the ribbon directly above the note input inside the Amount & Note card:
```html
<!-- Fuzzy Note Suggestions Ribbon -->
<Transition name="fade">
  <div
    v-if="suggestedNotes.length > 0"
    class="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar touch-pan-x"
  >
    <button
      v-for="suggestion in suggestedNotes"
      :key="suggestion"
      type="button"
      @pointerdown.prevent="applySuggestedNote(suggestion)"
      class="shrink-0 px-2.5 py-1 rounded-lg bg-sand-card border border-sand-border text-xs font-semibold text-stone-dark hover:bg-matcha-50 hover:border-matcha-300 transition-all btn-tactile active:scale-95"
    >
      {{ suggestion }}
    </button>
  </div>
</Transition>
```

### Handler: `applySuggestedNote(suggestion: string)`
```typescript
function applySuggestedNote(suggestion: string) {
  noteText.value = suggestion;
  
  // Keep focus and prevent virtual keyboard dismissal
  nextTick(() => {
    if (noteInputRef.value) {
      noteInputRef.value.focus();
      const len = suggestion.length;
      noteInputRef.value.setSelectionRange(len, len);
    }
  });
}
```
*Note: Using `@pointerdown.prevent` prevents the button from stealing focus away from the `<input>`, ensuring the native mobile keyboard does not flicker or close.*

---

## 5. Edge Cases & Constraints Matrix

| Scenario | Expected Behavior | Implementation Detail |
| :--- | :--- | :--- |
| **Empty Input** (`noteText === ''`) | Ribbon is completely hidden | `v-if="suggestedNotes.length > 0"` and guard `if (!noteText.value.trim()) return []` |
| **No Matches** (e.g. typing random gibberish) | Ribbon vanishes smoothly | Fuse returns no candidates $\rightarrow$ `suggestedNotes` is empty $\rightarrow$ ribbon vanishes |
| **Mobile Keyboard Opening** | Keyboard stays open when tapping suggestion | `@pointerdown.prevent` + `setSelectionRange(len, len)` |
| **Typo in Note** (e.g. *"nadi padang"*) | Matches *"Nasi Padang"* | Fuse `threshold: 0.4` handles 1–2 character substitutions and transpositions |
| **Multiple Words / Acronyms** | Matches partial prefix or substrings | Fuse searches whole text tokens |
| **Category Selection** | Category remains untouched | `applySuggestedNote` strictly writes to `noteText.value`; category state is never modified |
| **Transaction History Empty** (Fresh App) | No errors, clean empty list | `extractUniqueNotes([])` returns `[]` |

---

## 6. Testing Strategy (`src/utils/fuzzyNotes.test.ts`)

Unit tests must cover 100% of the fuzzy engine logic:
1. **Deduplication & Stat Computation**:
   - Correctly aggregates count for identical notes with different casing (`"Kopi"`, `"kopi"` $\rightarrow$ count 2).
   - Preserves latest timestamp.
2. **Exact & Prefix Matching**:
   - Matches `"ko"` $\rightarrow$ `["Kopi Kenangan", "Kopi Susu"]`.
3. **Typo Tolerance**:
   - `"nadi padang"` $\rightarrow$ matches `"Nasi Padang"`.
   - `"bensn"` $\rightarrow$ matches `"Bensin"`.
4. **Frecency Ranking**:
   - A note used 10 times ranks higher than a note with the same similarity score used once.
5. **Empty & Boundary Handling**:
   - Empty query returns `[]`.
   - Query matching no notes returns `[]`.
   - Empty transaction history returns `[]`.

---

## 7. Verification Checklist

Before closing the task:
- [ ] Run `npm run typecheck` to verify zero TypeScript errors.
- [ ] Run `npm run test` to verify all Vitest tests pass.
- [ ] Confirm no `git commit` or `git push` was executed (working tree stays unstaged/staged).
