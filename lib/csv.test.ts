import { describe, it, expect } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('joins headers and rows with commas and CRLF line endings', () => {
    const result = toCsv(['Nama', 'Volume (kg)'], [['Koperasi A', 100], ['Koperasi B', 200]]);
    expect(result).toBe('Nama,Volume (kg)\r\nKoperasi A,100\r\nKoperasi B,200');
  });

  it('quotes and escapes values containing commas', () => {
    const result = toCsv(['Lokasi'], [['Jakarta, Indonesia']]);
    expect(result).toBe('Lokasi\r\n"Jakarta, Indonesia"');
  });

  it('quotes and doubles embedded quote characters', () => {
    const result = toCsv(['Nama'], [['Koperasi "Maju" Bersama']]);
    expect(result).toBe('Nama\r\n"Koperasi ""Maju"" Bersama"');
  });

  it('quotes values containing newlines', () => {
    const result = toCsv(['Catatan'], [['Baris satu\nBaris dua']]);
    expect(result).toBe('Catatan\r\n"Baris satu\nBaris dua"');
  });

  it('returns just the header row when there are no data rows', () => {
    expect(toCsv(['Nama', 'Status'], [])).toBe('Nama,Status');
  });

  it('does not quote plain numbers or unquoted strings', () => {
    expect(toCsv(['A', 'B'], [[42, 'Aktif']])).toBe('A,B\r\n42,Aktif');
  });
});
