import Fuse from 'fuse.js';

export interface NoteStat {
  text: string;
  normalized: string;
  count: number;
  lastTimestamp: number;
}

/**
 * Aggregates unique transaction notes from past transactions.
 * Case-insensitive deduplication, preserving the casing of the most recent entry.
 */
export function extractUniqueNotes(
  transactions: Array<{ note?: string; timestamp?: string }>
): NoteStat[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const map = new Map<string, NoteStat>();

  for (const tx of transactions) {
    const rawNote = tx.note?.trim();
    if (!rawNote) continue;

    const normalized = rawNote.toLowerCase();
    const timestamp = tx.timestamp ? new Date(tx.timestamp).getTime() : 0;

    const existing = map.get(normalized);
    if (!existing) {
      map.set(normalized, {
        text: rawNote,
        normalized,
        count: 1,
        lastTimestamp: timestamp,
      });
    } else {
      existing.count += 1;
      if (timestamp >= existing.lastTimestamp) {
        existing.text = rawNote;
        existing.lastTimestamp = timestamp;
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Ranks past notes against the user's query using Fuse.js for typo tolerance,
 * boosted by historical frequency and recency.
 */
export function rankPastNotes(
  query: string,
  notes: NoteStat[],
  limit = 5
): string[] {
  const trimmed = query.trim();
  if (!trimmed || !notes || notes.length === 0) {
    return [];
  }

  const fuse = new Fuse(notes, {
    keys: ['text'],
    threshold: 0.35,
    distance: 100,
    includeScore: true,
    ignoreLocation: true,
  });

  const results = fuse.search(trimmed);
  if (results.length === 0) {
    return [];
  }

  const now = Date.now();
  const DAY_IN_MS = 1000 * 60 * 60 * 24;

  const scored = results.map((res) => {
    // Fuse score: 0 is exact match, 1 is mismatch
    const fuseScore = res.score ?? 0.5;
    // Cubic scaling gives strong preference to direct/close matches over loose ones
    const matchQuality = Math.pow(Math.max(0.01, 1 - fuseScore), 3);

    // Frequency boost: subtle logarithmic scaling (1 + 0.3 * ln(count))
    const freqBoost = 1 + 0.35 * Math.log(1 + res.item.count);

    // Recency decay: notes used recently get a gentle boost
    const ageDays = res.item.lastTimestamp > 0
      ? Math.max(0, (now - res.item.lastTimestamp) / DAY_IN_MS)
      : 60;
    const recencyMultiplier = Math.max(0.7, 1 - ageDays / 180);

    const finalScore = matchQuality * freqBoost * recencyMultiplier;

    return {
      text: res.item.text,
      finalScore,
    };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);

  return scored.slice(0, limit).map((s) => s.text);
}
