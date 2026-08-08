import { describe, it, expect } from 'vitest';
import { BIOSECURITY_CHECKLIST_ITEMS, determineBiosecurityHasil } from './biosecurity';

describe('BIOSECURITY_CHECKLIST_ITEMS', () => {
  it('has exactly 7 items with unique keys', () => {
    expect(BIOSECURITY_CHECKLIST_ITEMS).toHaveLength(7);
    const keys = BIOSECURITY_CHECKLIST_ITEMS.map((i) => i.key);
    expect(new Set(keys).size).toBe(7);
  });
});

describe('determineBiosecurityHasil', () => {
  it('returns lolos when no values are provided (no problems matched)', () => {
    expect(determineBiosecurityHasil({})).toBe('lolos');
  });

  it('returns lolos when every item has its non-problem value', () => {
    const values: Record<string, string> = {};
    for (const item of BIOSECURITY_CHECKLIST_ITEMS) {
      values[item.key] = item.options.find((o) => o !== item.problemValue)!;
    }
    expect(determineBiosecurityHasil(values)).toBe('lolos');
  });

  it('returns tidak_lolos when any single item has its problem value', () => {
    const values: Record<string, string> = { hamaPenyakit: 'Ditemukan' };
    expect(determineBiosecurityHasil(values)).toBe('tidak_lolos');
  });

  it('returns tidak_lolos when the awakKapal item is unhealthy', () => {
    const values: Record<string, string> = { awakKapal: 'Sakit' };
    expect(determineBiosecurityHasil(values)).toBe('tidak_lolos');
  });
});
