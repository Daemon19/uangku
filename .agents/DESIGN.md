# UangKu Design System & UI/UX Specification

## 1. Design Philosophy

**UangKu** is designed to eliminate financial logging friction and alleviate personal finance anxiety. Traditional banking and expense apps are often clinical, dark, or cluttered with multi-step wizards, complex categories, and nested dropdowns. 

UangKu embraces an organic, tactile note-taking feel called **Warm Sand & Matcha**.

### Core Tenets
1. **Calm Over Clinical**: Warm earth tones (creams, warm beige, deep matcha green) lower cognitive stress and convey organic mindfulness.
2. **Sub-3-Second Execution**: Every visual decision prioritizes rapid, single-thumb entry directly after paying for something.
3. **Tactile Feedback**: Every touch interaction produces subtle visual and acoustic feedback, mimicking physical keypads and stationery.
4. **Daylight Readability**: High contrast between deep stone text and warm sand surfaces ensures outdoor usability when logging purchases on the street or in warungs.

---

## 2. Color System & Design Tokens

### 2.1 Core Palette

| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Sand Background** (`sand-bg`) | `#FAF7F2` | Primary application viewport background (Warm Cream) |
| **Sand Surface** (`sand-surface`) | `#F3EFEA` | Input fields, active toggle tracks, badge bases |
| **Sand Card** (`sand-card`) | `#FFFFFF` | Transaction cards, headers, bottom navigation bar |
| **Sand Border** (`sand-border`) | `#E7E5E4` | Dividers, card strokes, subtle container outlines |
| **Sand Subtle** (`sand-subtle`) | `#EAE5DF` | Hover states, inactive pill borders |
| **Matcha Deep** (`matcha-deep`) | `#2D4A3E` | Primary brand accent, main buttons, summary card background |
| **Matcha Dark** (`matcha-dark`) | `#22382F` | Active states for primary buttons, gradient endpoints |
| **Matcha Darkest** (`matcha-darkest`) | `#16241E` | Deep pill containers inside dark headers |
| **Warm Amber** (`amber-warm`) | `#D97706` | Secondary accent, cash (Tunai) badges, spark indicators |
| **Stone Dark** (`stone-dark`) | `#292524` | Primary high-contrast typography, numeric inputs |
| **Stone Warm** (`stone-warm`) | `#78716C` | Subtitles, timestamp indicators, inactive button icons |
| **Stone Muted** (`stone-muted`) | `#A8A29E` | Placeholder text, secondary metadata |

### 2.2 Category Color Tokens

Each of the 9 categories features a distinct color pairing (vibrant icon tint on a gentle pastel container) to facilitate instant visual identification:

| Category | Icon Color | Background Tint | Emoji | Symbolism |
| :--- | :--- | :--- | :--- | :--- |
| **Makanan** | `#D97706` | `#FEF3C7` | 🍱 | Warm culinary amber |
| **Transportasi** | `#2563EB` | `#DBEAFE` | 🚕 | Mobility and transit blue |
| **Tagihan** | `#EAB308` | `#FEF9C3` | 💡 | Utility electricity yellow |
| **Shopping** | `#EC4899` | `#FCE7F3` | 🛍️ | Retail and goods pink |
| **Hiburan** | `#8B5CF6` | `#EDE9FE` | 🎬 | Leisure and cinema violet |
| **Kesehatan** | `#EF4444` | `#FEE2E2` | 💊 | Wellness and pharmacy red |
| **Edukasi** | `#0D9488` | `#CCFBF1` | 📚 | Growth and learning teal |
| **Hutang** | `#EA580C` | `#FFEDD5` | 🤝 | Commitment and balance orange |
| **Lainnya** | `#78716C` | `#F3EFEA` | 📦 | Miscellaneous stone neutral |

---

## 3. Typography & Hierarchy

### Font Families
* **Primary UI (`font-sans`)**: `Plus Jakarta Sans`, `Inter`, `system-ui`. Modern, geometric sans-serif optimized for legibility at small sizes.
* **Numeric & Tabular (`font-mono`)**: `JetBrains Mono`, `ui-monospace`. Used for precise currency amounts, transaction counts, and timestamp numbers to prevent layout jitter.

### Typographic Scale

| Level | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Amount** | `28px` - `36px` | Extrabold (`800`) | `1.1` | Numpad buffer display, header balance |
| **Headline** | `18px` | Bold (`700`) | `1.2` | App title, modal headers |
| **Body Primary** | `14px` | Bold / Medium (`500` / `700`) | `1.4` | Category labels, transaction titles, inputs |
| **Body Secondary** | `12px` | Normal / Semibold (`400` / `600`) | `1.4` | Transaction notes, filter buttons, toast alerts |
| **Caption / Badge** | `10px` - `11px` | Semibold (`600`) | `1.3` | Payment pills, timestamps, relative date tags |

---

## 4. UI Structure & Screen Layout

The application enforces a **Mobile-First Shell** (`w-full max-w-md min-h-screen`) centered horizontally with subtle desktop drop shadows.

```
+------------------------------------------+
|  Top Summary Header (Sticky)             |
|  - Branding & Offline status             |
|  - Total Spending Card (Matcha Gradient) |
|  - Cash (Tunai) vs Account (Rekening)    |
|  - Period Filters (Today, 7D, Month, All)|
+------------------------------------------+
|  Main Activity Stream (Scrollable Feed)  |
|  - Search Bar                            |
|  - Date Divider: "HARI INI"              |
|  - Transaction Row: Icon | Category | Rp |
|  - Date Divider: "KEMARIN"               |
|  - Transaction Row...                    |
+------------------------------------------+
|  Bottom Navigation Bar (Fixed)           |
|  [Riwayat]      [(+)]        [Analisis]  |
+------------------------------------------+
|  ======================================  |
|  Slide-Up Control Center (Overlay Pane)  |
|  - [v] Close Button | Mode Switcher      |
|  - Speed Numpad OR Smart NLP Textarea    |
|  - 9 Direct Category Chips               |
+------------------------------------------+
```

### 4.1 Top Summary Header
* **Brand Identity**: Features the UangKu leaf/sparkle badge with a green `Offline` pill emphasizing local reliability.
* **Spending Card**: A matcha green gradient (`from-matcha-deep to-matcha-dark`) card with white numeric figures.
* **Payment Split Breakdown**: Dual inner pills displaying total cash expenditure vs bank/rekening expenditure for the chosen period.
* **Period Filter Pills**: Horizontal scrollable chips for `Hari Ini` (Today), `7 Hari` (7 Days), `Bulan Ini` (This Month), and `Semua` (All).

### 4.2 Activity Stream & Chronological Feed
* **Sticky Day Headers**: Visual breaklines labeled with Indonesian relative time (`HARI INI`, `KEMARIN`, `2 HARI LALU`, etc.).
* **Transaction Row Layout**:
  - Left: 44px rounded category icon with tailored color background.
  - Middle: Category name, payment badge (`Tunai` in amber or `Rekening` in matcha), optional note memo, and time stamp.
  - Right: Negative Rupiah sum (`- Rp 25.000`) and quick-action icons (`Duplicate` and `Delete`).

### 4.3 Persistent Bottom Navigation Bar
* **Riwayat (History)**: Tap to scroll activity stream smoothly to top.
* **Elevated Floating Action Button (FAB) `(+)`**:
  - 56px circle with matcha green fill and elevated shadow (`shadow-lifted`).
  - Positioned `-mt-5` above the bar baseline for ergonomic thumb reach.
  - Tapping summons the slide-up input control center.
* **Analisis (Analytics)**: Shortcut directly opening category breakdown charts.

### 4.4 Full-View Slide-Up Control Center
* Activated by the FAB or open by default on launch.
* Dismissible via down chevron (`ChevronDown`) button.
* Top mode switcher tab:
  - **Mode Cepat**: Numeric keypad and direct category chips.
  - **Input Pintar**: Indonesian NLP freeform text field.

---

## 5. Input System: The Sub-3-Second Log Execution

Logging an expense must never exceed 3 seconds. UangKu achieves this through two distinct entry modalities:

### Mode A: Speed Numpad (Mode Cepat)
1. User taps numeric keys (`1` through `9`, `0`, and single `+000` multiplier).
2. The entered amount formats live (e.g. `25` $\rightarrow$ `+000` $\rightarrow$ `Rp 25.000`).
3. (Optional) User taps note field or switches payment pill.
4. **Instant Commit**: User taps any of the 9 category chips (e.g., `Makanan`). The transaction is stored immediately, a success chime plays, and inputs reset without requiring an extra "Save" confirmation button.

```
[ IDR  Rp 25.000 ]  [ Tunai | Rekening ]
[ Note: Nasi padang Keputih            ]
----------------------------------------
[ 🍱 Makanan ] [ 🚕 Transport ] [ 💡 Tagihan  ]
[ 🛍️ Shopping] [ 🎬 Hiburan   ] [ 💊 Kesehatan]
[ 📚 Edukasi ] [ 🤝 Hutang    ] [ 📦 Lainnya  ]
----------------------------------------
[  1  ]   [  2  ]   [  3  ]   [ Backspace ]
[  4  ]   [  5  ]   [  6  ]   [   Reset   ]
[  7  ]   [  8  ]   [  9  ]   [           ]
[         0           ]   [   +000    ]
```

### Mode B: Smart NLP Parser (Input Pintar)
1. User enters natural Indonesian phrasing: e.g. `"25rb nasi padang cash"`.
2. Real-time detection card extracts:
   - Amount: `25.000`
   - Category: `Makanan`
   - Payment: `Tunai`
   - Memo: `"nasi padang"`
3. User presses **Enter** or the send button to commit.

---

## 6. Interaction Physics & Acoustic Feedback

### 6.1 Tactile Visual Micro-Interactions
* `.btn-tactile`: Active press triggers an instant `transform: scale(0.97)` and slight inset shadow shift to replicate physical button depression.
* `.animate-shake`: When a user attempts to tap a category chip with Rp 0 entered, the amount display shakes horizontally with a red highlight border.
* **Celebration Milestone**: When an individual transaction is $\ge \text{Rp } 100.000$, a subtle confetti burst triggers from the bottom edge.

### 6.2 Procedural Web Audio Soundscapes
Generated in real-time via Web Audio API oscillators:
1. **Success Chime**: An arpeggiated C-major triad (C5 $523.25\text{Hz} \rightarrow$ E5 $659.25\text{Hz} \rightarrow$ G5 $783.99\text{Hz}$) with gentle triangle wave resonance over 320ms.
2. Audio can be toggled on/off at any time from the top header; state persists in `localStorage`.

---

## 7. Indonesian Natural Language Parsing (NLP) Rules

### Number / Multiplier Grammar
* `k`, `rb`, `ribu` $\rightarrow \times 1.000$ (e.g. `25k` $\rightarrow 25.000$, `25rb` $\rightarrow 25.000$).
* `jt`, `juta`, `m`, `mio` $\rightarrow \times 1.000.000$ (e.g. `1,5jt` $\rightarrow 1.500.000$, `2juta` $\rightarrow 2.000.000$).
* Thousand dot formats (e.g. `25.000` or `Rp 25.000`) are normalized.

### Payment Terminology Detection
* **Tunai**: `cash`, `tunai`, `uang pas`, `dompet`.
* **Rekening**: `card`, `kartu`, `debit`, `kredit`, `cc`, `bca`, `mandiri`, `bni`, `bri`, `gopay`, `ovo`, `dana`, `qris`, `transfer`, `rekening`, `bank`, `jago`, `seabank`, `shopeepay`.

### Merchant & Food Keyword Preservation
When parsing notes, keywords like `warung`, `resto`, `nasi`, `padang`, or `kopi` serve both as category clues and descriptive names. The parser preserves them in the note memo if descriptive words follow (e.g., `"warung bu tetty"` or `"nasi padang keputih"`).

---

## 8. Accessibility & Ergonomics

* **Contrast Standards**: All dark stone body text (`#292524`) exceeds WCAG AAA contrast ratio ($\ge 7:1$) against `#FAF7F2` and `#FFFFFF`.
* **Touch Target Size**: Every keypad button and category chip maintains a minimum touch target height of $52\text{px}$ to $60\text{px}$, preventing mis-taps.
* **One-Handed Reachability**: The primary entry pad and persistent action buttons are positioned within the lower $60\%$ of the viewport for comfortable single-thumb reach.
