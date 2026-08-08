import { describe, it, expect } from 'vitest';
import { nextNelayanId, nextKapalId, nextBiosecurityId, generateLocalId } from './id';

describe('nextNelayanId', () => {
  it('generates the first ID for a given month with no existing IDs', () => {
    expect(nextNelayanId([], new Date('2025-05-10'))).toBe('NEL-2505-000001');
  });

  it('increments the sequence for the same month', () => {
    const existing = ['NEL-2505-000001', 'NEL-2505-000002'];
    expect(nextNelayanId(existing, new Date('2025-05-10'))).toBe('NEL-2505-000003');
  });
});

describe('nextKapalId', () => {
  it('generates a 5-digit sequence', () => {
    expect(nextKapalId([], new Date('2025-05-10'))).toBe('KAP-2505-00001');
  });
});

describe('nextBiosecurityId', () => {
  it('generates an ID scoped to the exact date', () => {
    expect(nextBiosecurityId([], new Date('2025-05-10'))).toBe('BS-2025-05-10-001');
  });

  it('uses local-time date parts, consistent with yymm() used by nelayan/kapal IDs', () => {
    expect(nextBiosecurityId([], new Date(2025, 4, 10))).toBe('BS-2025-05-10-001');
  });
});

describe('generateLocalId', () => {
  it('returns crypto.randomUUID() when available', () => {
    const id = generateLocalId('JS');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('falls back to a prefixed id when crypto.randomUUID is unavailable', () => {
    const original = globalThis.crypto.randomUUID;
    // @ts-expect-error - intentionally removing for this test
    globalThis.crypto.randomUUID = undefined;
    try {
      const id = generateLocalId('JS');
      expect(id.startsWith('JS-')).toBe(true);
    } finally {
      globalThis.crypto.randomUUID = original;
    }
  });
});
