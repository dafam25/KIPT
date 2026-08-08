import { describe, it, expect } from 'vitest';
import { paginate, totalPages } from './table';

describe('paginate', () => {
  it('returns the first page slice', () => {
    expect(paginate([1, 2, 3, 4, 5], 1, 2)).toEqual([1, 2]);
  });

  it('returns the second page slice', () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
  });

  it('returns a partial final page', () => {
    expect(paginate([1, 2, 3, 4, 5], 3, 2)).toEqual([5]);
  });

  it('returns an empty array for a page beyond the data', () => {
    expect(paginate([1, 2, 3], 5, 2)).toEqual([]);
  });
});

describe('totalPages', () => {
  it('rounds up to cover a partial last page', () => {
    expect(totalPages(5, 2)).toBe(3);
  });

  it('returns 1 for an empty list, never 0', () => {
    expect(totalPages(0, 10)).toBe(1);
  });

  it('returns 1 when everything fits on one page', () => {
    expect(totalPages(4, 10)).toBe(1);
  });
});
