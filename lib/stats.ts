import type { Nelayan, Kapal, HasilTangkap } from './types';

export function totalNelayan(list: Nelayan[]): number {
  return list.length;
}

export function totalKapal(list: Kapal[]): number {
  return list.length;
}

export function kapalMelautCount(list: Kapal[]): number {
  return list.filter((k) => k.status === 'melaut').length;
}

export function totalHasilTangkapKg(list: HasilTangkap[]): number {
  return list.reduce(
    (sum, h) => sum + h.jenisIkan.reduce((s, j) => s + j.beratKg, 0),
    0,
  );
}

export function komposisiHasilTangkap(
  list: HasilTangkap[],
): { nama: string; beratKg: number; persen: number }[] {
  const totals = new Map<string, number>();
  for (const h of list) {
    for (const j of h.jenisIkan) {
      totals.set(j.nama, (totals.get(j.nama) ?? 0) + j.beratKg);
    }
  }
  const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([nama, beratKg]) => ({
      nama,
      beratKg,
      persen: grandTotal > 0 ? (beratKg / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.beratKg - a.beratKg);
}

export function trenHasilTangkapHarian(
  list: HasilTangkap[],
): { tanggal: string; totalKg: number }[] {
  const totals = new Map<string, number>();
  for (const h of list) {
    const beratHari = h.jenisIkan.reduce((s, j) => s + j.beratKg, 0);
    totals.set(h.tanggal, (totals.get(h.tanggal) ?? 0) + beratHari);
  }
  return [...totals.entries()]
    .map(([tanggal, totalKg]) => ({ tanggal, totalKg }))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}
