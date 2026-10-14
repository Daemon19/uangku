## NEVER COMMIT CHANGES TO GIT

# Operational Guidelines & Rules for AI Agents

Welcome to **UangKu**. This document outlines non-negotiable rules, project architecture principles, development workflows, and coding conventions for AI agents operating in this repository.

---

## 1. Golden Rules & Guardrails

1. **NEVER COMMIT CHANGES TO GIT**
   - Under no circumstances should an agent run `git commit`, `git push`, or modify git history. All changes must remain unstaged or staged in the working tree for the user to review and commit.
2. **Offline-First & Local-Only (Dexie.js / IndexedDB)**
   - Do not introduce remote server dependencies, REST backends, GraphQL, or external cloud databases. UangKu is 100% client-side and offline-first using Dexie.js (IndexedDB).
3. **Zero External Audio Assets**
   - Do not import `.mp3`, `.wav`, or audio URLs. All sound feedback must use the built-in Native Web Audio API synthesizer (`src/utils/audio.ts`).
4. **Sub-3-Second Log Execution**
   - Preserve the app's primary value proposition: a user must be able to log an expense in under 3 seconds. Do not add required date pickers, multi-step confirmation modals, or heavy dropdowns to the primary entry flow.
5. **Always Verify with Typecheck & Tests**
   - Before completing any task, always run `npm run typecheck` and `npm run test` to verify zero type regressions and 100% passing test suites.

---

## 2. Project Overview & Tech Stack

* **Application**: Ultra-low-friction mobile-first daily expense tracking Progressive Web App (PWA) tailored for Indonesian Rupiah (IDR).
* **Framework**: Vue 3 (Composition API with `<script setup lang="ts">`).
* **Persistence**: Dexie.js v4 (`indexedDB`) with reactive `useLiveQuery`.
* **Styling**: Tailwind CSS with custom "Warm Sand & Matcha" theme tokens.
* **Icons**: Lucide Icons (`lucide-vue-next`).
* **Build & PWA**: Vite 6, `@vitejs/plugin-vue`, `vite-plugin-pwa`.
* **Testing**: Vitest (`npm run test`).
* **Type Checker**: Vue TSC (`vue-tsc --noEmit`).

---

## 3. Essential Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server |
| `npm run typecheck` | Validates TypeScript and Vue SFC typings without emitting files |
| `npm run test` | Executes Vitest unit tests |
| `npm run build` | Runs `vue-tsc` typecheck and builds production bundle to `dist/` |
| `npm run preview` | Previews the production build locally |

---

## 4. Architectural Patterns & Conventions

### A. Vue 3 & Component Design
* Use single-file components (SFCs) with `<script setup lang="ts">`.
* Props and emits must be strictly typed using TypeScript interfaces:
  ```typescript
  defineProps<{
    transactions: Transaction[];
    currentFilter: TimeFilter;
  }>();

  const emit = defineEmits<{
    (e: 'update:filter', filter: TimeFilter): void;
    (e: 'log-expense', payload: NewExpensePayload): void;
  }>();
  ```
* Avoid storing global application state in pinia or ad-hoc event buses when IndexedDB + `useLiveQuery` is the source of truth.

### B. Dexie.js Reactivity (`useLiveQuery`)
* All transaction reads across the app observe the Dexie database reactively via `useLiveQuery`:
  ```typescript
  import { useLiveQuery } from '@/composables/useLiveQuery';
  import { db } from '@/db';

  const allTransactions = useLiveQuery(
    () => db.transactions.reverse().toArray(),
    []
  );
  ```
* When modifying the database schema (`src/db/index.ts`), increment the Dexie database version and provide migration paths if breaking changes are introduced.

### C. Automatic Preference Learning (`categoryMemory`)
* Every time a transaction is recorded (`addTransaction`), UangKu remembers the user's payment method choice (`tunai` vs `rekening`) for that category in `categoryMemory`.
* Any new entry flow should respect `getPreferredPayment(categoryName)` unless the user manually toggles the payment pill.

### D. Indonesian Natural Language Parser (NLP)
* The parser (`src/utils/nlpParser.ts`) handles Indonesian currency multipliers (`rb`, `ribu`, `k`, `jt`, `juta`), payment keywords (`tunai`, `cash`, `rekening`, `bca`, `gopay`, `qris`), category classification, and note extraction.
* Whenever altering regex patterns or keyword sets in `nlpParser.ts` or `categories.ts`, always add corresponding test cases in `src/utils/nlpParser.test.ts`.

### E. Web Audio Synthesizer
* Sound effects reside in `src/utils/audio.ts` and are accessed via `useAudioFeedback()`:
  - `triggerKeypress()`: Fast subtle click (750Hz -> 300Hz in 25ms).
  - `triggerSuccess()`: Arpeggiated C-major triad chime (C5 -> E5 -> G5).
  - `triggerDelete()`: Two-stage descending cue (warning tap + swooping drop).
* Sound respects user preference stored in `localStorage` (`uangku_sound_enabled`).

### F. Styling & Layout Philosophy
* Always develop mobile-first. The app shell is capped at `max-w-md` centered on desktop to preserve authentic native mobile ergonomics.
* Utilize semantic color tokens from `tailwind.config.js`:
  - `bg-sand-bg`, `bg-sand-surface`, `bg-sand-card`, `border-sand-border`
  - `text-matcha-deep`, `bg-matcha-deep`, `text-amber-warm`, `bg-amber-warm`
  - `text-stone-dark`, `text-stone-warm`, `text-stone-muted`
* Use `.btn-tactile` for interactive buttons to give tactile micro-feedback.

---

## 5. Agent Verification Checklist

Before reporting completion on any code modification:
- [ ] Ran `npm run typecheck` and resolved all TypeScript errors.
- [ ] Ran `npm run test` and ensured all Vitest test suites pass.
- [ ] Verified no git commit was made (`git status` shows clean commit history).
- [ ] Maintained documentation integrity and preserved existing comments.