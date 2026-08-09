import { describe, it, expect } from 'vitest';
import { paginate, totalPages, pageNumbersToShow } from './table';

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

describe('pageNumbersToShow', () => {
  it('returns every page when there are 7 or fewer', () => {
    expect(pageNumbersToShow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageNumbersToShow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('shows an ellipsis after page 1 when the current page is far from the start', () => {
    expect(pageNumbersToShow(8, 20)).toEqual([1, '...', 7, 8, 9, '...', 20]);
  });

  it('shows no leading ellipsis when the current page is near the start', () => {
    expect(pageNumbersToShow(2, 20)).toEqual([1, 2, 3, '...', 20]);
  });

  it('shows no trailing ellipsis when the current page is near the end', () => {
    expect(pageNumbersToShow(19, 20)).toEqual([1, '...', 18, 19, 20]);
  });

  it('returns [1] for a single page', () => {
    expect(pageNumbersToShow(1, 1)).toEqual([1]);
  });
});
