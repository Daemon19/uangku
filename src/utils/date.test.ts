import { describe, it, expect } from 'vitest';
import {
  formatTime,
  getRelativeDayLabel,
  formatFullDate,
  toDateTimeLocalInput,
  fromDateTimeLocalInput,
} from './date';

describe('date utils', () => {
  it('formats time to 24h format', () => {
    const iso = '2026-10-17T14:35:00.000Z';
    const formatted = formatTime(iso);
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('formats relative day label for today and yesterday', () => {
    const now = new Date();
    expect(getRelativeDayLabel(now.toISOString())).toBe('Hari Ini');

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    expect(getRelativeDayLabel(yesterday.toISOString())).toBe('Kemarin');
  });

  it('formats full Indonesian date string', () => {
    const iso = '2026-10-17T12:00:00.000Z';
    const full = formatFullDate(iso);
    expect(full).toBeDefined();
    expect(full.length).toBeGreaterThan(0);
  });

  describe('datetime-local input converters', () => {
    it('converts ISO string to local input value YYYY-MM-DDTHH:mm', () => {
      const date = new Date(2026, 9, 17, 15, 30, 0); // Oct 17, 2026 15:30
      const localStr = toDateTimeLocalInput(date.toISOString());
      expect(localStr).toBe('2026-10-17T15:30');
    });

    it('returns empty string on invalid ISO input', () => {
      expect(toDateTimeLocalInput('invalid-date')).toBe('');
    });

    it('converts local input string back to ISO maintaining original seconds/ms', () => {
      const orig = new Date(2026, 9, 17, 10, 15, 42, 123).toISOString();
      const localInput = '2026-10-17T11:20';
      const resultIso = fromDateTimeLocalInput(localInput, orig);
      const parsed = new Date(resultIso);

      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(9);
      expect(parsed.getDate()).toBe(17);
      expect(parsed.getHours()).toBe(11);
      expect(parsed.getMinutes()).toBe(20);
      expect(parsed.getSeconds()).toBe(42);
    });

    it('falls back safely if local string is empty or invalid', () => {
      const orig = '2026-10-17T10:15:42.000Z';
      expect(fromDateTimeLocalInput('', orig)).toBe(orig);
      expect(fromDateTimeLocalInput('invalid', orig)).toBe(orig);
    });
  });
});
