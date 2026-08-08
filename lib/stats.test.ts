import { describe, it, expect } from 'vitest';
import {
  totalNelayan,
  totalKapal,
  totalHasilTangkapKg,
  kapalMelautCount,
  komposisiHasilTangkap,
  trenHasilTangkapHarian,
} from './stats';
import type { Nelayan, Kapal, HasilTangkap } from './types';

const nelayan: Nelayan[] = [{ id: 'NEL-1' } as Nelayan, { id: 'NEL-2' } as Nelayan];
const kapal: Kapal[] = [
  { id: 'KAP-1', status: 'melaut' } as Kapal,
  { id: 'KAP-2', status: 'sandar' } as Kapal,
  { id: 'KAP-3', status: 'melaut' } as Kapal,
];
const hasilTangkap: HasilTangkap[] = [
  {
    id: '1', tanggal: '2025-05-10',
    jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 100, jumlahEkor: 10, kondisi: 'Segar' }],
  } as HasilTangkap,
  {
    id: '2', tanggal: '2025-05-10',
    jenisIkan: [{ nama: 'Ikan Cakalang', beratKg: 50, jumlahEkor: 5, kondisi: 'Segar' }],
  } as HasilTangkap,
  {
    id: '3', tanggal: '2025-05-11',
    jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 50, jumlahEkor: 5, kondisi: 'Segar' }],
  } as HasilTangkap,
];

describe('totalNelayan', () => {
  it('counts the list', () => { expect(totalNelayan(nelayan)).toBe(2); });
});

describe('totalKapal', () => {
  it('counts the list', () => { expect(totalKapal(kapal)).toBe(3); });
});

describe('kapalMelautCount', () => {
  it('counts only melaut status', () => { expect(kapalMelautCount(kapal)).toBe(2); });
});

describe('totalHasilTangkapKg', () => {
  it('sums beratKg across all jenisIkan entries', () => {
    expect(totalHasilTangkapKg(hasilTangkap)).toBe(200);
  });
});

describe('komposisiHasilTangkap', () => {
  it('groups by jenis ikan and computes percentage of total', () => {
    const result = komposisiHasilTangkap(hasilTangkap);
    const tongkol = result.find((r) => r.nama === 'Ikan Tongkol');
    expect(tongkol?.beratKg).toBe(150);
    expect(tongkol?.persen).toBeCloseTo(75, 5);
  });

  it('returns an empty array for an empty input (divide-by-zero guard)', () => {
    expect(komposisiHasilTangkap([])).toEqual([]);
  });
});

describe('trenHasilTangkapHarian', () => {
  it('groups by date, sorted ascending', () => {
    expect(trenHasilTangkapHarian(hasilTangkap)).toEqual([
      { tanggal: '2025-05-10', totalKg: 150 },
      { tanggal: '2025-05-11', totalKg: 50 },
    ]);
  });

  it('returns an empty array for an empty input', () => {
    expect(trenHasilTangkapHarian([])).toEqual([]);
  });
});
