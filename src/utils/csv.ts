import type { Transaction } from '@/db/types';
import { formatTime } from './date';

/**
 * Escape CSV field to handle quotes, commas, and newlines per RFC 4180
 */
function escapeCsvField(val: string | number | undefined | null): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generate CSV text from transactions
 */
export function generateCsv(transactions: Transaction[]): string {
  const headers = [
    'ID',
    'Tanggal',
    'Jam',
    'Kategori',
    'Metode_Pembayaran',
    'Nominal_Rp',
    'Catatan'
  ];

  const rows = transactions.map(tx => {
    const d = new Date(tx.timestamp);
    const dateFormatted = d.toISOString().split('T')[0];
    const timeFormatted = formatTime(tx.timestamp);

    return [
      escapeCsvField(tx.id ?? ''),
      escapeCsvField(dateFormatted),
      escapeCsvField(timeFormatted),
      escapeCsvField(tx.category),
      escapeCsvField(tx.type === 'tunai' ? 'Tunai' : 'Rekening'),
      escapeCsvField(tx.amount),
      escapeCsvField(tx.note ?? '')
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download transactions as CSV file
 */
export function exportToCsv(transactions: Transaction[]): void {
  const csvContent = '\uFEFF' + generateCsv(transactions); // Add BOM for Excel UTF-8 support
  const today = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `UangKu_Pengeluaran_${today}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Download transactions as JSON file
 */
export function exportToJson(transactions: Transaction[]): void {
  const jsonContent = JSON.stringify(transactions, null, 2);
  const today = new Date().toISOString().split('T')[0];
  downloadFile(jsonContent, `UangKu_Backup_${today}.json`, 'application/json');
}
