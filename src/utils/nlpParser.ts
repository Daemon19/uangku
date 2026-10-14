import type { PaymentType } from '@/db/types';
import { CATEGORIES } from './categories';

export interface ParsedExpense {
  amount: number;
  category: string;
  type: PaymentType | null; // null if not explicitly mentioned in text
  note: string;
  rawInput: string;
  detectedPaymentKeyword?: string;
  detectedCategoryKeyword?: string;
}

const PAYMENT_KEYWORDS_TUNAI = ['cash', 'tunai', 'uang pas', 'dompet'];
const PAYMENT_KEYWORDS_REKENING = [
  'card', 'kartu', 'debit', 'kredit', 'cc', 'bca', 'mandiri', 'bni', 'bri',
  'gopay', 'ovo', 'dana', 'qris', 'transfer', 'rekening', 'bank', 'jago',
  'seabank', 'shopeepay'
];

/**
 * Parse an Indonesian amount expression from input text.
 * Returns the parsed number and the matched substring range to remove.
 */
function extractAmount(text: string): { amount: number; matchedText: string } | null {
  // Regex 1: Matches numbers with multipliers like "1,5jt", "1.5 jt", "25rb", "25k", "25 ribu", "2 juta", "500k", "Rp 25.000"
  // Handles decimal comma or dot
  const multiplierRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(jt|juta|m|mio|rb|ribu|k)(?![a-zA-Z0-9])/i;
  const multiMatch = text.match(multiplierRegex);

  if (multiMatch) {
    const rawNumStr = multiMatch[1].replace(',', '.');
    const unit = multiMatch[2].toLowerCase();
    const baseNum = parseFloat(rawNumStr);

    if (!isNaN(baseNum)) {
      let multiplier = 1;
      if (['jt', 'juta', 'm', 'mio'].includes(unit)) {
        multiplier = 1000000;
      } else if (['rb', 'ribu', 'k'].includes(unit)) {
        multiplier = 1000;
      }
      return {
        amount: Math.round(baseNum * multiplier),
        matchedText: multiMatch[0],
      };
    }
  }

  // Regex 2: Formatted numbers like "Rp 25.000", "Rp25000", "25.000" (with thousands dots)
  const formattedRegex = /(?:rp\.?\s*)(\d{1,3}(?:\.\d{3})+)(?![a-zA-Z0-9])/i;
  const formMatch = text.match(formattedRegex);
  if (formMatch) {
    const amount = parseInt(formMatch[1].replace(/\./g, ''), 10);
    if (!isNaN(amount) && amount > 0) {
      return {
        amount,
        matchedText: formMatch[0],
      };
    }
  }

  // Regex 3: Plain numbers without unit, optionally prefixed with "Rp"
  // e.g. "Rp 25000", "25000", "150000" (at least 3 digits to avoid stray single numbers)
  const plainRegex = /(?:rp\.?\s*)?(\b\d{3,9}\b)/i;
  const plainMatch = text.match(plainRegex);
  if (plainMatch) {
    const amount = parseInt(plainMatch[1], 10);
    if (!isNaN(amount) && amount > 0) {
      return {
        amount,
        matchedText: plainMatch[0],
      };
    }
  }

  return null;
}

/**
 * Detect payment method from text.
 */
function extractPayment(text: string): { type: PaymentType; matchedWord: string } | null {
  // Sort by length descending to match phrases like "uang pas" before "pas"
  const allTunai = [...PAYMENT_KEYWORDS_TUNAI].sort((a, b) => b.length - a.length);
  for (const kw of allTunai) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      return { type: 'tunai', matchedWord: match[0] };
    }
  }

  const allRekening = [...PAYMENT_KEYWORDS_REKENING].sort((a, b) => b.length - a.length);
  for (const kw of allRekening) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      return { type: 'rekening', matchedWord: match[0] };
    }
  }

  return null;
}

/**
 * Detect spending category from text based on approved keyword lists.
 */
function extractCategory(text: string): { category: string; matchedKeywords: string[] } | null {
  const matchedCategories: { category: string; count: number; keywords: string[] }[] = [];

  for (const cat of CATEGORIES) {
    const matchedKws: string[] = [];
    for (const kw of cat.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      const match = text.match(regex);
      if (match) {
        matchedKws.push(match[0]);
      }
    }
    if (matchedKws.length > 0) {
      matchedCategories.push({
        category: cat.name,
        count: matchedKws.length,
        keywords: matchedKws,
      });
    }
  }

  if (matchedCategories.length === 0) {
    return null;
  }

  // Pick category with most keyword matches
  matchedCategories.sort((a, b) => b.count - a.count);
  return {
    category: matchedCategories[0].category,
    matchedKeywords: matchedCategories[0].keywords,
  };
}

/**
 * Main parser function: takes user freeform text and extracts
 * amount, category, payment method, and note.
 */
export function parseSmartExpense(input: string): ParsedExpense {
  const rawInput = input.trim();
  let workingText = rawInput;

  // 1. Extract amount
  const amountResult = extractAmount(workingText);
  let amount = 0;
  if (amountResult) {
    amount = amountResult.amount;
    workingText = workingText.replace(amountResult.matchedText, ' ');
  }

  // 2. Extract payment method
  const paymentResult = extractPayment(workingText);
  let detectedType: PaymentType | null = null;
  let detectedPaymentKeyword: string | undefined;

  if (paymentResult) {
    detectedType = paymentResult.type;
    detectedPaymentKeyword = paymentResult.matchedWord;
    workingText = workingText.replace(new RegExp(`\\b${paymentResult.matchedWord}\\b`, 'gi'), ' ');
  }

  // 3. Extract category
  const categoryResult = extractCategory(workingText);
  let category = 'Lainnya';
  let detectedCategoryKeyword: string | undefined;

  // Keywords that often serve as merchant/place descriptors (e.g. "warung bu tetty", "resto padang")
  const MERCHANT_PREFIXES = ['warung', 'resto', 'toko', 'kafe', 'cafe', 'mall', 'bengkel'];

  if (categoryResult) {
    category = categoryResult.category;
    detectedCategoryKeyword = categoryResult.matchedKeywords.join(', ');

    // Remove matched category keywords from workingText so note is clean
    for (const kw of categoryResult.matchedKeywords) {
      // If the keyword is a merchant prefix (like "warung") and other words follow it, keep it in the note!
      if (MERCHANT_PREFIXES.includes(kw.toLowerCase())) {
        const checkAfter = new RegExp(`\\b${kw}\\s+[a-zA-Z0-9]`, 'i');
        if (checkAfter.test(workingText)) {
          continue; // Preserve "warung bu tetty" in note
        }
      }
      workingText = workingText.replace(new RegExp(`\\b${kw}\\b`, 'gi'), ' ');
    }
  }

  // 4. Clean residual tokens to form note memo
  let note = workingText
    .replace(/[,\-_:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading/trailing trivial filler prepositions like "di", "ke", "buat", "untuk"
  note = note.replace(/^(?:di|ke|buat|untuk|via|pake|pakai)\s+/i, '');
  note = note.replace(/\s+(?:di|ke|buat|untuk)$/i, '');

  return {
    amount,
    category,
    type: detectedType,
    note,
    rawInput,
    detectedPaymentKeyword,
    detectedCategoryKeyword,
  };
}
