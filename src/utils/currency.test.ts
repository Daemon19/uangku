import { describe, it, expect } from 'vitest';
import { formatRupiah, formatNumberOnly, parseRupiah } from './currency';

describe('Currency Utility', () => {
  it('formats amounts in IDR locale format with Rp prefix', () => {
    expect(formatRupiah(25000)).toMatch(/Rp\s*25\.000/);
    expect(formatRupiah(1500000)).toMatch(/Rp\s*1\.500\.000/);
    expect(formatRupiah(0)).toMatch(/Rp\s*0/);
  });

  it('formats number only with dots', () => {
    expect(formatNumberOnly(25000)).toBe('25.000');
    expect(formatNumberOnly(1500000)).toBe('1.500.000');
    expect(formatNumberOnly(0)).toBe('0');
  });

  it('parses formatted string back to number', () => {
    expect(parseRupiah('25.000')).toBe(25000);
    expect(parseRupiah('Rp 1.500.000')).toBe(1500000);
    expect(parseRupiah('0')).toBe(0);
    expect(parseRupiah('')).toBe(0);
  });
});
