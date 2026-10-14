/**
 * Format a number to Indonesian Rupiah representation: e.g. "Rp 25.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // Intl in IDR outputs "Rp 25.000" or "Rp25.000". Let's standardize to "Rp 25.000"
  return formatted.replace(/^Rp\s?/, 'Rp ');
}

/**
 * Format number with Indonesian thousand dot separators: e.g. "25.000"
 */
export function formatNumberOnly(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse an Indonesian formatted number string like "25.000" or "25000" to number
 */
export function parseRupiah(str: string): number {
  if (!str) return 0;
  // Remove non-numeric characters except comma/dot
  const cleaned = str.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
