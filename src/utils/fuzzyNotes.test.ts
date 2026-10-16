import { describe, it, expect } from 'vitest';
import { extractUniqueNotes, rankPastNotes, type NoteStat } from './fuzzyNotes';

describe('extractUniqueNotes', () => {
  it('returns empty array when given empty input', () => {
    expect(extractUniqueNotes([])).toEqual([]);
    expect(extractUniqueNotes([{}, { note: '' }, { note: '   ' }])).toEqual([]);
  });

  it('aggregates and deduplicates notes case-insensitively', () => {
    const transactions = [
      { note: 'Kopi Kenangan', timestamp: '2026-10-10T10:00:00Z' },
      { note: 'kopi kenangan', timestamp: '2026-10-12T10:00:00Z' },
      { note: 'Nasi Padang', timestamp: '2026-10-11T12:00:00Z' },
      { note: 'KOPI KENANGAN', timestamp: '2026-10-15T08:00:00Z' },
    ];

    const result = extractUniqueNotes(transactions);
    expect(result).toHaveLength(2);

    const kopi = result.find((n) => n.normalized === 'kopi kenangan');
    expect(kopi).toBeDefined();
    expect(kopi?.count).toBe(3);
    // Preserves casing of the most recent entry
    expect(kopi?.text).toBe('KOPI KENANGAN');

    const nasi = result.find((n) => n.normalized === 'nasi padang');
    expect(nasi).toBeDefined();
    expect(nasi?.count).toBe(1);
  });
});

describe('rankPastNotes', () => {
  const sampleNotes: NoteStat[] = [
    {
      text: 'Nasi Padang Keputih',
      normalized: 'nasi padang keputih',
      count: 10,
      lastTimestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    },
    {
      text: 'Nasi Goreng Kambing',
      normalized: 'nasi goreng kambing',
      count: 2,
      lastTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    },
    {
      text: 'Kopi Kenangan Mantan',
      normalized: 'kopi kenangan mantan',
      count: 15,
      lastTimestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    },
    {
      text: 'Bensin Pertalite',
      normalized: 'bensin pertalite',
      count: 8,
      lastTimestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    },
    {
      text: 'Biskuit Roma',
      normalized: 'biskuit roma',
      count: 1,
      lastTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
    },
  ];

  it('returns empty array when query is empty or whitespace', () => {
    expect(rankPastNotes('', sampleNotes)).toEqual([]);
    expect(rankPastNotes('   ', sampleNotes)).toEqual([]);
    expect(rankPastNotes('ko', [])).toEqual([]);
  });

  it('matches exact prefix queries', () => {
    const results = rankPastNotes('kopi', sampleNotes);
    expect(results).toContain('Kopi Kenangan Mantan');
  });

  it('matches with typo tolerance ("nadi" -> "Nasi")', () => {
    const results = rankPastNotes('nadi padang', sampleNotes);
    expect(results[0]).toBe('Nasi Padang Keputih');
  });

  it('matches typos in common words like "bensn"', () => {
    const results = rankPastNotes('bensn', sampleNotes);
    expect(results[0]).toBe('Bensin Pertalite');
  });

  it('prioritizes high frequency and recent items', () => {
    const results = rankPastNotes('nasi', sampleNotes);
    // Nasi Padang (count 10, 1 hr ago) should rank above Nasi Goreng (count 2, 5 days ago)
    expect(results[0]).toBe('Nasi Padang Keputih');
    expect(results[1]).toBe('Nasi Goreng Kambing');
  });

  it('respects the limit argument', () => {
    const results = rankPastNotes('nasi', sampleNotes, 1);
    expect(results).toHaveLength(1);
    expect(results[0]).toBe('Nasi Padang Keputih');
  });

  it('returns empty array when query does not match anything', () => {
    const results = rankPastNotes('zzzzzzzzzzz', sampleNotes);
    expect(results).toEqual([]);
  });
});
