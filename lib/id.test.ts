import { describe, it, expect } from 'vitest';
import { nextNelayanId, nextKapalId, nextBiosecurityId } from './id';

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
});
