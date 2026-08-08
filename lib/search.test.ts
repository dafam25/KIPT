import { describe, it, expect } from 'vitest';
import { searchGlobal } from './search';
import type { Nelayan, Kapal, HasilTangkap } from './types';

const nelayan: Nelayan[] = [
  { id: 'NEL-2505-000001', nama: 'Budi Santoso' } as Nelayan,
  { id: 'NEL-2505-000002', nama: 'Siti Aminah' } as Nelayan,
];

const kapal: Kapal[] = [
  { id: 'KAP-2505-00001', nama: 'KM Bahari Jaya' } as Kapal,
  { id: 'KAP-2505-00002', nama: 'KM Samudra Indah' } as Kapal,
];

const hasilTangkap: HasilTangkap[] = [
  { id: 'ht-uuid-1', lokasi: 'Perairan Selat Bali' } as HasilTangkap,
  { id: 'ht-uuid-2', lokasi: 'Perairan Utara Jawa' } as HasilTangkap,
];

describe('searchGlobal', () => {
  it('returns an empty array for an empty or whitespace-only query', () => {
    expect(searchGlobal('', nelayan, kapal, hasilTangkap)).toEqual([]);
    expect(searchGlobal('   ', nelayan, kapal, hasilTangkap)).toEqual([]);
  });

  it('matches nelayan by nama, case-insensitively', () => {
    const result = searchGlobal('budi', nelayan, kapal, hasilTangkap);
    expect(result).toEqual([
      { id: 'NEL-2505-000001', kategori: 'Nelayan', judul: 'Budi Santoso', subjudul: 'NEL-2505-000001', href: '/nelayan/NEL-2505-000001' },
    ]);
  });

  it('matches nelayan by id', () => {
    const result = searchGlobal('000002', nelayan, kapal, hasilTangkap);
    expect(result.map((r) => r.id)).toEqual(['NEL-2505-000002']);
  });

  it('matches kapal by nama, case-insensitively', () => {
    const result = searchGlobal('bahari', nelayan, kapal, hasilTangkap);
    expect(result).toEqual([
      { id: 'KAP-2505-00001', kategori: 'Kapal', judul: 'KM Bahari Jaya', subjudul: 'KAP-2505-00001', href: '/kapal/KAP-2505-00001' },
    ]);
  });

  it('matches kapal by id', () => {
    const result = searchGlobal('kap-2505-00002', nelayan, kapal, hasilTangkap);
    expect(result.map((r) => r.id)).toEqual(['KAP-2505-00002']);
  });

  it('matches hasil tangkap by lokasi, case-insensitively', () => {
    const result = searchGlobal('selat bali', nelayan, kapal, hasilTangkap);
    expect(result).toEqual([
      { id: 'ht-uuid-1', kategori: 'Hasil Tangkap', judul: 'Perairan Selat Bali', subjudul: 'ht-uuid-1', href: '/hasil-tangkap' },
    ]);
  });

  it('matches hasil tangkap by id', () => {
    const result = searchGlobal('ht-uuid-2', nelayan, kapal, hasilTangkap);
    expect(result.map((r) => r.id)).toEqual(['ht-uuid-2']);
  });

  it('returns results from all three categories when the query matches across them', () => {
    const mixedNelayan: Nelayan[] = [{ id: 'NEL-1', nama: 'Perairan Man' } as Nelayan];
    const result = searchGlobal('perairan', mixedNelayan, kapal, hasilTangkap);
    expect(result.map((r) => r.kategori)).toEqual(['Nelayan', 'Hasil Tangkap', 'Hasil Tangkap']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchGlobal('zzz-no-match-zzz', nelayan, kapal, hasilTangkap)).toEqual([]);
  });
});
