import { describe, it, expect } from 'vitest';
import { formatRupiah, formatNumber, formatDate, formatPercent } from './format';

describe('formatRupiah', () => {
  it('formats whole rupiah with thousands separators', () => {
    expect(formatRupiah(214850000)).toBe('Rp 214.850.000');
  });
});

describe('formatNumber', () => {
  it('formats with thousands separators', () => {
    expect(formatNumber(45678)).toBe('45.678');
  });
});

describe('formatDate', () => {
  it('formats an ISO date as "12 Mei 2025"', () => {
    expect(formatDate('2025-05-12')).toBe('12 Mei 2025');
  });
});

describe('formatPercent', () => {
  it('formats a decimal as a percent with one sign', () => {
    expect(formatPercent(8.2)).toBe('8.2%');
  });
});
