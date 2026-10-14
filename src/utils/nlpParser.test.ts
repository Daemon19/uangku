import { describe, it, expect } from 'vitest';
import { parseSmartExpense } from './nlpParser';

describe('Bahasa Indonesia NLP Expense Parser', () => {
  it('parses "25rb makan siang cash warung bu tetty"', () => {
    const result = parseSmartExpense('25rb makan siang cash warung bu tetty');
    expect(result.amount).toBe(25000);
    expect(result.category).toBe('Makanan');
    expect(result.type).toBe('tunai');
    expect(result.note.toLowerCase()).toContain('warung bu tetty');
  });

  it('parses "1,5jt tagihan listrik bca"', () => {
    const result = parseSmartExpense('1,5jt tagihan listrik bca');
    expect(result.amount).toBe(1500000);
    expect(result.category).toBe('Tagihan');
    expect(result.type).toBe('rekening');
    expect(result.note).toBe('');
  });

  it('parses dot decimals like "1.5 jt sewa kuliah mandiri"', () => {
    const result = parseSmartExpense('1.5 jt sewa kuliah mandiri');
    expect(result.amount).toBe(1500000);
    expect(result.category).toBe('Edukasi');
    expect(result.type).toBe('rekening');
  });

  it('parses "50k bensin gopay pertalite"', () => {
    const result = parseSmartExpense('50k bensin gopay pertalite');
    expect(result.amount).toBe(50000);
    expect(result.category).toBe('Transportasi');
    expect(result.type).toBe('rekening');
    expect(result.note.toLowerCase()).toContain('pertalite');
  });

  it('parses raw numbers with Rp prefix like "Rp 75.000 nonton bioskop tunai"', () => {
    const result = parseSmartExpense('Rp 75.000 nonton bioskop tunai');
    expect(result.amount).toBe(75000);
    expect(result.category).toBe('Hiburan');
    expect(result.type).toBe('tunai');
  });

  it('parses "100000 bayar cicilan hutang qris"', () => {
    const result = parseSmartExpense('100000 bayar cicilan hutang qris');
    expect(result.amount).toBe(100000);
    expect(result.category).toBe('Hutang');
    expect(result.type).toBe('rekening');
  });

  it('parses health expenses "35ribu obat apotek tunai"', () => {
    const result = parseSmartExpense('35ribu obat apotek tunai');
    expect(result.amount).toBe(35000);
    expect(result.category).toBe('Kesehatan');
    expect(result.type).toBe('tunai');
  });

  it('parses shopping "200k beli baju transfer shopee"', () => {
    const result = parseSmartExpense('200k beli baju transfer shopee');
    expect(result.amount).toBe(200000);
    expect(result.category).toBe('Shopping');
    expect(result.type).toBe('rekening');
  });

  it('falls back gracefully to Lainnya and null type if not stated', () => {
    const result = parseSmartExpense('5000 parkir liar');
    expect(result.amount).toBe(5000);
    expect(result.type).toBe(null);
    expect(result.note.toLowerCase()).toContain('liar');
  });
});
