import Dexie, { type Table } from 'dexie';
import type { Transaction, CategoryMemory, PaymentType } from './types';
import { CATEGORIES } from '@/utils/categories';

export class UangKuDatabase extends Dexie {
  transactions!: Table<Transaction, number>;
  categoryMemory!: Table<CategoryMemory, string>;

  constructor() {
    super('UangKuDatabase');
    this.version(1).stores({
      transactions: '++id, amount, category, type, timestamp',
      categoryMemory: 'category, preferredType'
    });
  }
}

export const db = new UangKuDatabase();

/**
 * Get the preferred payment method for a given category.
 * If not yet recorded, defaults based on category definition.
 */
export async function getPreferredPayment(categoryName: string): Promise<PaymentType> {
  try {
    const memory = await db.categoryMemory.get(categoryName);
    if (memory && memory.preferredType) {
      return memory.preferredType;
    }
  } catch (err) {
    console.warn('Could not read category memory:', err);
  }
  const matched = CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  return matched ? matched.defaultType : 'tunai';
}

/**
 * Store or update the preferred payment method for a category.
 */
export async function setPreferredPayment(categoryName: string, type: PaymentType): Promise<void> {
  await db.categoryMemory.put({
    category: categoryName,
    preferredType: type
  });
}

/**
 * Log a new transaction and update preferred payment memory.
 */
export async function addTransaction(data: Omit<Transaction, 'id'>): Promise<number> {
  const id = await db.transactions.add({
    amount: data.amount,
    category: data.category,
    type: data.type,
    note: data.note?.trim() || undefined,
    timestamp: data.timestamp || new Date().toISOString()
  });

  // Learn user preference
  try {
    await setPreferredPayment(data.category, data.type);
  } catch (err) {
    console.warn('Failed to update category memory:', err);
  }

  return id;
}

/**
 * Delete a transaction by its id.
 */
export async function deleteTransaction(id: number): Promise<void> {
  await db.transactions.delete(id);
}

/**
 * Clear all transactions and memories.
 */
export async function clearAllData(): Promise<void> {
  await db.transactions.clear();
  await db.categoryMemory.clear();
}

/**
 * Seed realistic Indonesian sample transactions for initial onboarding or demo.
 */
export async function seedSampleData(): Promise<void> {
  const now = new Date();
  const todayIso = (hours: number, mins: number) => {
    const d = new Date(now);
    d.setHours(hours, mins, 0, 0);
    return d.toISOString();
  };

  const yesterdayIso = (hours: number, mins: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    d.setHours(hours, mins, 0, 0);
    return d.toISOString();
  };

  const sampleItems: Omit<Transaction, 'id'>[] = [
    {
      amount: 28000,
      category: 'Makanan',
      type: 'tunai',
      note: 'Kopi Kenangan Mantan + Roti',
      timestamp: todayIso(8, 30)
    },
    {
      amount: 25000,
      category: 'Makanan',
      type: 'tunai',
      note: 'Nasi Padang Komplit Siang',
      timestamp: todayIso(12, 15)
    },
    {
      amount: 45000,
      category: 'Transportasi',
      type: 'rekening',
      note: 'Gojek ke kantor pulang pergi',
      timestamp: todayIso(9, 10)
    },
    {
      amount: 150000,
      category: 'Tagihan',
      type: 'rekening',
      note: 'Token Listrik PLN',
      timestamp: yesterdayIso(19, 45)
    },
    {
      amount: 75000,
      category: 'Hiburan',
      type: 'rekening',
      note: 'Tiket Bioskop XXI Weekend',
      timestamp: yesterdayIso(16, 20)
    },
    {
      amount: 35000,
      category: 'Kesehatan',
      type: 'tunai',
      note: 'Vitamin C & Obat Flu Apotek',
      timestamp: yesterdayIso(10, 5)
    }
  ];

  await db.transactions.bulkAdd(sampleItems);

  // Set memory
  await db.categoryMemory.bulkPut([
    { category: 'Makanan', preferredType: 'tunai' },
    { category: 'Transportasi', preferredType: 'rekening' },
    { category: 'Tagihan', preferredType: 'rekening' },
    { category: 'Hiburan', preferredType: 'rekening' },
    { category: 'Kesehatan', preferredType: 'tunai' },
  ]);
}
