# Edit Transaction (Date, Time, Category, Amount, Note & Payment Method)

## Problem Statement

How might we allow users to accurately correct and edit recorded transactions (date, time, amount, category, note, and payment method) via mobile-first interaction without compromising the sub-3-second speed of the primary entry flow?

## Recommended Direction

Introduce a dedicated **`EditTransactionModal.vue`** bottom sheet / modal:

1. **Triggering Interaction:**

   - Tapping anywhere on a transaction card in [ActivityStream.vue](file:///home/atma/code/uangku/src/components/ActivityStream.vue) / [TransactionItem.vue](file:///home/atma/code/uangku/src/components/TransactionItem.vue) opens the edit bottom sheet modal.
   - **Cleaner Transaction Rows:** Remove the `Duplicate` and `Delete` action buttons from [TransactionItem.vue](file:///home/atma/code/uangku/src/components/TransactionItem.vue), giving the list rows a cleaner, uncluttered appearance with zero accidental deletions while scrolling.

2. **Form Layout & Controls:**

   - **Amount:** Clean numeric input with formatted Rupiah preview.
   - **Category:** Compact visual grid / scrollable chips matching the existing category palette and icons (`CategoryIcon.vue`).
   - **Date & Time:** Native `datetime-local` input formatted to the user's local timezone for precise timestamp adjustments (supporting backdated logs).
   - **Payment Method:** Tactile segmented pill selector (`Tunai` / `Rekening`).
   - **Note / Memo:** Optional text field for transaction context.
   - **Modal Secondary Actions (Footer):**
     - **Duplicate ("Catat Ulang"):** Clones this transaction's details to log a new entry right away.
     - **Delete ("Hapus"):** Deletes the transaction with a confirmation prompt or distinct destructive styling (`text-red-600` / soft red background).

3. **Data Layer & Reactivity:**

   - Persists edits using Dexie: `db.transactions.update(id, updatedFields)`.
   - Handles deletions via `db.transactions.delete(id)`.
   - Dexie's reactive `useLiveQuery` automatically updates the chronological group sorting, daily totals, and summary headers with zero manual state refresh.

## Key Assumptions to Validate

- [ ] **Touch vs Scroll ergonomics:** Tapping to edit does not conflict with vertical scrolling on mobile browsers.
- [ ] **Cross-browser datetime picker:** Native HTML `<input type="datetime-local">` renders reliably across Android Chrome, iOS Safari, and desktop browsers while honoring the "Warm Sand & Matcha" theme.
- [ ] **Chronological re-sorting:** Updating a transaction's timestamp cleanly moves the item into its appropriate daily grouping in the stream without visual glitches.
- [ ] **Clean row affordance:** Users intuitively understand that tapping the row opens the detail/edit modal now that individual row action buttons are moved inside.

## MVP Scope

- `EditTransactionModal.vue` component with transition backdrop and smooth slide-up animation.
- Tap event handler on `TransactionItem.vue` emitting `select` or `edit`.
- Relocated **Duplicate** and **Delete** actions inside the modal footer.
- Removal of the floating/hover duplicate & delete buttons from the row list items in `TransactionItem.vue`.
- Input validation (amount must be > 0, valid category).
- Save, Duplicate, Delete, and Cancel actions with tactile feedback (`.btn-tactile`).
- Audio feedback confirmation on successful save or delete (`triggerSuccess()`).

## Not Doing (and Why)

- **Inline Editing within the transaction row:** Rejected because mobile screens lack the horizontal space for category pickers, datetime selectors, and amount keyboards without cramped, error-prone tapping.
- **Batch / Multi-select Editing:** Out of scope for personal finance logs to keep the interface lightweight and simple.
- **Overwriting Category Memory on Edit:** Do not overwrite the user's global category payment preference (`categoryMemory`) during historical edits, so past corrections do not unintentionally alter future default shortcuts.
