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
  rekapPerKapal,
  rekapPerWilayah,
  totalVolumeKoperasi,
  totalNilaiKoperasi,
  aktifKoperasiCount,
  komposisiVolumeKoperasi,
  totalVolumePasarIndustri,
  totalNilaiPasarIndustri,
  aktifPasarIndustriCount,
  komposisiVolumePasarIndustri,
  peringkatVolume,
  nelayanAktifCount,
  nelayanTerverifikasiCount,
  nelayanTergabungKoperasiCount,
} from './stats';
import type { Nelayan, Kapal, HasilTangkap, Koperasi, PasarIndustri } from './types';

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

const hasilTangkapDenganLokasi: HasilTangkap[] = [
  { id: '1', kapalId: 'KAP-1', tanggal: '2025-05-10', lokasi: 'Perairan Selat Bali', jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 100, jumlahEkor: 10, kondisi: 'Segar' }] } as HasilTangkap,
  { id: '2', kapalId: 'KAP-1', tanggal: '2025-05-11', lokasi: 'Perairan Selat Bali', jenisIkan: [{ nama: 'Ikan Cakalang', beratKg: 50, jumlahEkor: 5, kondisi: 'Segar' }] } as HasilTangkap,
  { id: '3', kapalId: 'KAP-2', tanggal: '2025-05-11', lokasi: 'Perairan Utara Jawa', jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 30, jumlahEkor: 3, kondisi: 'Segar' }] } as HasilTangkap,
];

const kapalUntukRekap: Kapal[] = [
  { id: 'KAP-1', nama: 'KM. Bahari Jaya' } as Kapal,
  { id: 'KAP-2', nama: 'KM. Samudra Indah' } as Kapal,
];

describe('rekapPerKapal', () => {
  it('groups by kapal, resolves the name, and sorts descending by total weight', () => {
    expect(rekapPerKapal(hasilTangkapDenganLokasi, kapalUntukRekap)).toEqual([
      { label: 'KM. Bahari Jaya', totalKg: 150, jumlahTrip: 2 },
      { label: 'KM. Samudra Indah', totalKg: 30, jumlahTrip: 1 },
    ]);
  });

  it('falls back to the raw kapalId if no matching vessel is found', () => {
    const result = rekapPerKapal(hasilTangkapDenganLokasi, []);
    expect(result.find((r) => r.label === 'KAP-1')).toBeTruthy();
  });
});

describe('rekapPerWilayah', () => {
  it('groups by lokasi and sorts descending by total weight', () => {
    expect(rekapPerWilayah(hasilTangkapDenganLokasi)).toEqual([
      { label: 'Perairan Selat Bali', totalKg: 150, jumlahTrip: 2 },
      { label: 'Perairan Utara Jawa', totalKg: 30, jumlahTrip: 1 },
    ]);
  });
});

const koperasi: Koperasi[] = [
  { id: 'KOP-1', nama: 'Koperasi Bahari', volumeKg: 300, nilaiTransaksi: 5_000_000, status: 'Aktif' } as Koperasi,
  { id: 'KOP-2', nama: 'Koperasi Nusantara', volumeKg: 100, nilaiTransaksi: 2_000_000, status: 'Tidak Aktif' } as Koperasi,
];

const pasarIndustri: PasarIndustri[] = [
  { id: 'PAS-1', nama: 'Pasar Ikan Sentral', volumeKg: 500, nilaiTransaksi: 9_000_000, status: 'Aktif' } as PasarIndustri,
  { id: 'PAS-2', nama: 'Industri Olahan Jaya', volumeKg: 500, nilaiTransaksi: 1_000_000, status: 'Aktif' } as PasarIndustri,
];

describe('totalVolumeKoperasi', () => {
  it('sums volumeKg across all koperasi', () => { expect(totalVolumeKoperasi(koperasi)).toBe(400); });
});

describe('totalNilaiKoperasi', () => {
  it('sums nilaiTransaksi across all koperasi', () => { expect(totalNilaiKoperasi(koperasi)).toBe(7_000_000); });
});

describe('aktifKoperasiCount', () => {
  it('counts only Aktif status', () => { expect(aktifKoperasiCount(koperasi)).toBe(1); });
});

describe('komposisiVolumeKoperasi', () => {
  it('maps nama/volumeKg to nama/beratKg/persen, sorted descending', () => {
    expect(komposisiVolumeKoperasi(koperasi)).toEqual([
      { nama: 'Koperasi Bahari', beratKg: 300, persen: 75 },
      { nama: 'Koperasi Nusantara', beratKg: 100, persen: 25 },
    ]);
  });

  it('returns an empty array for an empty input (divide-by-zero guard)', () => {
    expect(komposisiVolumeKoperasi([])).toEqual([]);
  });
});

describe('totalVolumePasarIndustri', () => {
  it('sums volumeKg across all records', () => { expect(totalVolumePasarIndustri(pasarIndustri)).toBe(1000); });
});

describe('totalNilaiPasarIndustri', () => {
  it('sums nilaiTransaksi across all records', () => { expect(totalNilaiPasarIndustri(pasarIndustri)).toBe(10_000_000); });
});

describe('aktifPasarIndustriCount', () => {
  it('counts only Aktif status', () => { expect(aktifPasarIndustriCount(pasarIndustri)).toBe(2); });
});

describe('komposisiVolumePasarIndustri', () => {
  it('maps nama/volumeKg to nama/beratKg/persen', () => {
    const result = komposisiVolumePasarIndustri(pasarIndustri);
    expect(result.find((r) => r.nama === 'Pasar Ikan Sentral')?.persen).toBeCloseTo(50, 5);
  });
});

describe('peringkatVolume', () => {
  it('ranks by descending volumeKg, 1-based', () => {
    expect(peringkatVolume(koperasi, 'KOP-1')).toBe(1);
    expect(peringkatVolume(koperasi, 'KOP-2')).toBe(2);
  });

  it('works for any entity shaped with id and volumeKg (e.g. PasarIndustri)', () => {
    expect(peringkatVolume(pasarIndustri, 'PAS-1')).toBe(1);
  });
});

describe('nelayanAktifCount', () => {
  it('counts only aktif status', () => {
    const list: Nelayan[] = [
      { id: 'N1', status: 'aktif' } as Nelayan,
      { id: 'N2', status: 'nonaktif' } as Nelayan,
      { id: 'N3', status: 'aktif' } as Nelayan,
    ];
    expect(nelayanAktifCount(list)).toBe(2);
  });
});

describe('nelayanTerverifikasiCount', () => {
  it('counts only terverifikasi true', () => {
    const list: Nelayan[] = [
      { id: 'N1', terverifikasi: true } as Nelayan,
      { id: 'N2', terverifikasi: false } as Nelayan,
    ];
    expect(nelayanTerverifikasiCount(list)).toBe(1);
  });
});

describe('nelayanTergabungKoperasiCount', () => {
  it('counts only non-null koperasiId', () => {
    const list: Nelayan[] = [
      { id: 'N1', koperasiId: 'KOP-1' } as Nelayan,
      { id: 'N2', koperasiId: null } as Nelayan,
    ];
    expect(nelayanTergabungKoperasiCount(list)).toBe(1);
  });

  it('returns 0 for an empty list', () => {
    expect(nelayanTergabungKoperasiCount([])).toBe(0);
  });
});
