export type PaymentType = 'tunai' | 'rekening';

export interface Transaction {
  id?: number;          // Auto-incremented primary key
  amount: number;       // Numeric value in Rupiah (e.g. 25000)
  category: string;     // One of the 9 allowed categories
  type: PaymentType;    // 'tunai' (Cash) or 'rekening' (Card/Account)
  note?: string;        // Optional transaction memo
  timestamp: string;    // ISO 8601 Date string
}

export interface CategoryMemory {
  category: string;     // Category Name (e.g. "Makanan")
  preferredType: PaymentType; // 'tunai' or 'rekening'
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  keywords: string[];
  defaultType: PaymentType;
  color: string;
  bgLight: string;
}

export type TimeFilter = 'today' | '7days' | 'month' | 'all';
