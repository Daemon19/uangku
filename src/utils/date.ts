import type { Transaction, TimeFilter } from '@/db/types';

/**
 * Format timestamp to 24-hour time "14:35"
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

/**
 * Format relative day header: "Hari Ini", "Kemarin", or "14 Okt 2026"
 */
export function getRelativeDayLabel(isoString: string): string {
  try {
    const target = new Date(isoString);
    const today = new Date();
    
    const isSameDate = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDate(target, today)) {
      return 'Hari Ini';
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (isSameDate(target, yesterday)) {
      return 'Kemarin';
    }

    return target.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: target.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Format full Indonesian date: "Rabu, 14 Oktober 2026"
 */
export function formatFullDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Filter transactions based on selected period
 */
export function filterTransactionsByTime(transactions: Transaction[], filter: TimeFilter): Transaction[] {
  if (filter === 'all') return transactions;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (filter === 'today') {
    return transactions.filter(t => new Date(t.timestamp).getTime() >= startOfToday);
  }

  if (filter === '7days') {
    const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
    return transactions.filter(t => new Date(t.timestamp).getTime() >= sevenDaysAgo);
  }

  if (filter === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return transactions.filter(t => new Date(t.timestamp).getTime() >= startOfMonth);
  }

  return transactions;
}

/**
 * Check if a date string is from today
 */
export function isToday(isoString: string): boolean {
  const target = new Date(isoString);
  const today = new Date();
  return (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate()
  );
}
