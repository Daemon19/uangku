# Product Requirement & System Specification: UangKu

## 1. Executive Summary & Core Objective

**UangKu** is an ultra-low-friction, mobile-first daily expense tracking Progressive Web App (PWA) designed for real-time transaction accounting in Rupiah (IDR).

### Target Performance Goal
**Sub-3-Second Log Execution.** The user should be able to log spent money immediately after a transaction without navigating complex forms, choosing dates, or managing heavy drop-downs.

---

## 2. Tech Stack Requirements (Stack 5: Dexie.js + Vue 3 PWA)

* **Framework**: Vue 3 (Composition API with `<script setup>`).
* **Build Tool & PWA**: Vite with `@vite-pwa/vue` for full offline-first functionality and home-screen installability.
* **Database & Persistence**: Dexie.js (Developer-friendly IndexedDB wrapper) with live queries.
* **Styling**: Tailwind CSS (Warm Sand & Matcha custom theme).
* **Iconography**: Lucide Icons (`lucide-vue-next` or CDN).
* **Audio Feedback**: Native Web Audio API Synthesizer (Zero external audio asset dependencies).

---

## 3. Visual Design System: Warm Sand & Matcha

Designed to lower financial anxiety, provide high daylight readability, and create an organic, tactile note-taking feel.

### Color Tokens

| Token | Hex Code | Role / Usage |
| :--- | :--- | :--- |
| **Background** | `#FAF7F2` | Main screen background (Warm Cream) |
| **Surface Primary** | `#FFFFFF` | Card surfaces, modal containers (Pure White) |
| **Surface Secondary** | `#F3EFEA` | Input background, button base (Soft Beige) |
| **Primary Accent** | `#2D4A3E` | Primary buttons, total display, active states (Matcha Deep Forest) |
| **Secondary Accent** | `#D97706` | Highlight badges, cash badges, active tags (Warm Amber) |
| **Neutral Text** | `#292524` | Primary high-contrast text (Stone Dark) |
| **Muted Text / Borders** | `#78716C` / `#E7E5E4` | Subtitles, inactive keypads, subtle dividers (Warm Stone) |

---

## 4. UI/UX Structure & Layout Specs

### A. Top Summary Header
* **App Name**: `UangKu` with a leaf/matcha icon badge.
* **Daily Total**: Prominently displays today's total spending in `Rp` (e.g., `Rp 45.000`).
* **Payment Split**: Two small pills showing Cash (`Tunai`) vs Account (`Rekening/Card`) totals for the current day.
* **Utility Toolbar**: Sound effects toggle, Category Analytics Modal, and Settings/Data Export button.

### B. Live Activity Stream (Main Feed)
* Chronological list of transactions logged today or selected time filter.
* Each card displays: Category Icon, Category Name, Payment Type Tag, Timestamp, Note (if present), and Amount in `Rp`.
* Quick actions on each row: **Duplicate** (re-log) and **Delete**.

### C. Fixed Bottom Control Center
* **Mode Switcher Tabs**: Toggle between `Keyboard Numpad` and `Smart Text Parser` (`Input Pintar`).
* **Payment Method Switcher**: Toggle between `Tunai` (Cash) and `Rekening/Card` (Account).
* **Quick Numpad + Category Chips**:
  * Large numeric keypad with `+000` (Ribuan) multiplier for quick Rupiah typing.
  * Tapping a category chip directly commits and logs the transaction.

---

## 5. Spending Categories & Indonesian NLP Specs

### A. Approved Categories

1. **Edukasi** (📚) — *Keywords*: `edukasi`, `buku`, `kursus`, `sekolah`, `kuliah`, `spp`, `udemy`, `les`
2. **Hiburan** (🎬) — *Keywords*: `hiburan`, `bioskop`, `game`, `nonton`, `netflix`, `spotify`, `main`, `steam`
3. **Makanan** (🍱) — *Keywords*: `makanan`, `makan`, `minum`, `kopi`, `resto`, `warung`, `gofood`, `grabfood`, `sarapan`, `siang`, `malam`, `camilan`, `snack`
4. **Kesehatan** (💊) — *Keywords*: `kesehatan`, `obat`, `dokter`, `apotek`, `vitamin`, `rs`, `sakit`, `klinik`
5. **Transportasi** (🚕) — *Keywords*: `transportasi`, `trans`, `ojek`, `grab`, `gojek`, `bensin`, `tol`, `parkir`, `bus`, `kereta`, `mrt`
6. **Tagihan** (💡) — *Keywords*: `tagihan`, `listrik`, `air`, `pdam`, `wifi`, `indihome`, `pulsa`, `kuota`, `langganan`
7. **Hutang** (🤝) — *Keywords*: `hutang`, `pinjam`, `bayar hutang`, `cicilan`, `arisan`, `pinjol`
8. **Shopping** (🛍️) — *Keywords*: `shopping`, `belanja`, `baju`, `sepatu`, `tokped`, `shopee`, `mall`, `baju`
9. **Lainnya** (📦) — *Keywords*: `lainnya`, `misc`, `dll`, `insidental`

---

### B. Bahasa Indonesia Natural Language Parser (NLP)

The Smart Text parser evaluates freeform text strings in real-time.

#### 1. Number / Rupiah Multipliers:
* `rb` / `ribu` / `k` $\rightarrow$ Multiply by $1.000$ (e.g., `25rb`, `25k`, `25ribu` $\rightarrow$ `25000`)
* `jt` / `juta` / `m` $\rightarrow$ Multiply by $1.000.000$ (e.g., `1,5jt`, `2juta` $\rightarrow$ `1500000`, `2000000`)
* Raw numeric strings like `15000` or `Rp 15.000` are normalized automatically.

#### 2. Payment Method Recognition:
* **Cash / Tunai**: `cash`, `tunai`, `uang pas`, `dompet`
* **Account / Rekening**: `card`, `kartu`, `debit`, `bca`, `mandiri`, `gopay`, `ovo`, `dana`, `qris`, `transfer`, `rekening`, `bank`, `cc`

#### 3. Parse Example Execution:

```text
Input: "25rb makan siang cash warung bu tetty"
Parsed Result:
  - Amount: 25.000
  - Category: Makanan
  - Type: cash
  - Note: "warung bu tetty"

Input: "1,5jt tagihan listrik bca"
Parsed Result:
  - Amount: 1.500.000
  - Category: Tagihan
  - Type: account
  - Note: ""
```

---

## 6. Dexie.js Storage Architecture

### Database Schema Definition (`db.js`)

```javascript
import Dexie from 'dexie';

export const db = new Dexie('UangKuDatabase');

db.version(1).stores({
  transactions: '++id, amount, category, type, timestamp',
  categoryMemory: 'category, preferredType'
});
```

### Data Models

```typescript
interface Transaction {
  id?: number;          // Auto-incremented primary key
  amount: number;       // Numeric value in Rupiah (e.g. 25000)
  category: string;     // One of the 9 allowed categories
  type: 'cash' | 'account';
  note?: string;        // Optional transaction memo
  timestamp: string;    // ISO Date string
}

interface CategoryMemory {
  category: string;     // Category Name (e.g. "Makanan")
  preferredType: 'cash' | 'account';
}
```
