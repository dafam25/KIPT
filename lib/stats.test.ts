import { describe, it, expect } from 'vitest';
import {
  totalNelayan,
  totalKapal,
  totalHasilTangkapKg,
  kapalMelautCount,
  komposisiHasilTangkap,
  trenHasilTangkapHarian,
  hasilTangkapForKapal,
  totalJamMelaut,
  totalNilaiTangkapan,
  rataRataPerTripKg,
  kapalSandarCount,
  kapalTidakAktifCount,
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

const hasilTangkapDenganWaktu: HasilTangkap[] = [
  {
    id: '1', kapalId: 'KAP-1', tanggal: '2025-05-10',
    waktuMulai: '06:00', waktuSelesai: '12:30',
    jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 100, jumlahEkor: 10, kondisi: 'Segar' }],
    estimasiNilai: 2_500_000,
  } as HasilTangkap,
  {
    id: '2', kapalId: 'KAP-1', tanggal: '2025-05-11',
    waktuMulai: '05:00', waktuSelesai: '09:00',
    jenisIkan: [{ nama: 'Ikan Cakalang', beratKg: 50, jumlahEkor: 5, kondisi: 'Segar' }],
    estimasiNilai: 1_250_000,
  } as HasilTangkap,
  {
    id: '3', kapalId: 'KAP-2', tanggal: '2025-05-11',
    waktuMulai: '06:00', waktuSelesai: '10:00',
    jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 30, jumlahEkor: 3, kondisi: 'Segar' }],
    estimasiNilai: 750_000,
  } as HasilTangkap,
];

const kapalBerbagaiStatus: Kapal[] = [
  { id: 'KAP-1', status: 'melaut' } as Kapal,
  { id: 'KAP-2', status: 'sandar' } as Kapal,
  { id: 'KAP-3', status: 'sandar' } as Kapal,
  { id: 'KAP-4', status: 'tidak_aktif' } as Kapal,
];

describe('hasilTangkapForKapal', () => {
  it('filters to only the given kapal', () => {
    const result = hasilTangkapForKapal('KAP-1', hasilTangkapDenganWaktu);
    expect(result.map((h) => h.id)).toEqual(['1', '2']);
  });
});

describe('totalJamMelaut', () => {
  it('sums hours between waktuMulai and waktuSelesai', () => {
    const kap1 = hasilTangkapForKapal('KAP-1', hasilTangkapDenganWaktu);
    expect(totalJamMelaut(kap1)).toBeCloseTo(6.5 + 4, 5);
  });
});

describe('totalNilaiTangkapan', () => {
  it('sums estimasiNilai', () => {
    const kap1 = hasilTangkapForKapal('KAP-1', hasilTangkapDenganWaktu);
    expect(totalNilaiTangkapan(kap1)).toBe(3_750_000);
  });
});

describe('rataRataPerTripKg', () => {
  it('divides total kg by trip count', () => {
    const kap1 = hasilTangkapForKapal('KAP-1', hasilTangkapDenganWaktu);
    expect(rataRataPerTripKg(kap1)).toBe(75);
  });

  it('returns 0 for an empty list', () => {
    expect(rataRataPerTripKg([])).toBe(0);
  });
});

describe('kapalSandarCount', () => {
  it('counts only sandar status', () => {
    expect(kapalSandarCount(kapalBerbagaiStatus)).toBe(2);
  });
});

describe('kapalTidakAktifCount', () => {
  it('counts only tidak_aktif status', () => {
    expect(kapalTidakAktifCount(kapalBerbagaiStatus)).toBe(1);
  });
});
