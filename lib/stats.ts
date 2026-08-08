import type { Nelayan, Kapal, HasilTangkap, Koperasi, PasarIndustri } from './types';

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

export function hasilTangkapForKapal(kapalId: string, list: HasilTangkap[]): HasilTangkap[] {
  return list.filter((h) => h.kapalId === kapalId);
}

function jamFromRange(waktuMulai: string, waktuSelesai: string): number {
  const [mulaiH, mulaiM] = waktuMulai.split(':').map(Number);
  const [selesaiH, selesaiM] = waktuSelesai.split(':').map(Number);
  return (selesaiH * 60 + selesaiM - (mulaiH * 60 + mulaiM)) / 60;
}

export function totalJamMelaut(list: HasilTangkap[]): number {
  return list.reduce((sum, h) => sum + jamFromRange(h.waktuMulai, h.waktuSelesai), 0);
}

export function totalNilaiTangkapan(list: HasilTangkap[]): number {
  return list.reduce((sum, h) => sum + h.estimasiNilai, 0);
}

export function rataRataPerTripKg(list: HasilTangkap[]): number {
  if (list.length === 0) return 0;
  return totalHasilTangkapKg(list) / list.length;
}

export function kapalSandarCount(list: Kapal[]): number {
  return list.filter((k) => k.status === 'sandar').length;
}

export function kapalTidakAktifCount(list: Kapal[]): number {
  return list.filter((k) => k.status === 'tidak_aktif').length;
}

export function rekapPerKapal(
  list: HasilTangkap[],
  kapal: Kapal[],
): { label: string; totalKg: number; jumlahTrip: number }[] {
  const totals = new Map<string, { totalKg: number; jumlahTrip: number }>();
  for (const h of list) {
    const beratTrip = h.jenisIkan.reduce((s, j) => s + j.beratKg, 0);
    const current = totals.get(h.kapalId) ?? { totalKg: 0, jumlahTrip: 0 };
    totals.set(h.kapalId, { totalKg: current.totalKg + beratTrip, jumlahTrip: current.jumlahTrip + 1 });
  }
  return [...totals.entries()]
    .map(([kapalId, v]) => ({
      label: kapal.find((k) => k.id === kapalId)?.nama ?? kapalId,
      totalKg: v.totalKg,
      jumlahTrip: v.jumlahTrip,
    }))
    .sort((a, b) => b.totalKg - a.totalKg);
}

export function rekapPerWilayah(
  list: HasilTangkap[],
): { label: string; totalKg: number; jumlahTrip: number }[] {
  const totals = new Map<string, { totalKg: number; jumlahTrip: number }>();
  for (const h of list) {
    const beratTrip = h.jenisIkan.reduce((s, j) => s + j.beratKg, 0);
    const current = totals.get(h.lokasi) ?? { totalKg: 0, jumlahTrip: 0 };
    totals.set(h.lokasi, { totalKg: current.totalKg + beratTrip, jumlahTrip: current.jumlahTrip + 1 });
  }
  return [...totals.entries()]
    .map(([lokasi, v]) => ({ label: lokasi, totalKg: v.totalKg, jumlahTrip: v.jumlahTrip }))
    .sort((a, b) => b.totalKg - a.totalKg);
}

export function totalVolumeKoperasi(list: Koperasi[]): number {
  return list.reduce((sum, k) => sum + k.volumeKg, 0);
}

export function totalNilaiKoperasi(list: Koperasi[]): number {
  return list.reduce((sum, k) => sum + k.nilaiTransaksi, 0);
}

export function aktifKoperasiCount(list: Koperasi[]): number {
  return list.filter((k) => k.status === 'Aktif').length;
}

export function komposisiVolumeKoperasi(
  list: Koperasi[],
): { nama: string; beratKg: number; persen: number }[] {
  const grandTotal = list.reduce((sum, k) => sum + k.volumeKg, 0);
  return [...list]
    .map((k) => ({
      nama: k.nama,
      beratKg: k.volumeKg,
      persen: grandTotal > 0 ? (k.volumeKg / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.beratKg - a.beratKg);
}

export function totalVolumePasarIndustri(list: PasarIndustri[]): number {
  return list.reduce((sum, p) => sum + p.volumeKg, 0);
}

export function totalNilaiPasarIndustri(list: PasarIndustri[]): number {
  return list.reduce((sum, p) => sum + p.nilaiTransaksi, 0);
}

export function aktifPasarIndustriCount(list: PasarIndustri[]): number {
  return list.filter((p) => p.status === 'Aktif').length;
}

export function komposisiVolumePasarIndustri(
  list: PasarIndustri[],
): { nama: string; beratKg: number; persen: number }[] {
  const grandTotal = list.reduce((sum, p) => sum + p.volumeKg, 0);
  return [...list]
    .map((p) => ({
      nama: p.nama,
      beratKg: p.volumeKg,
      persen: grandTotal > 0 ? (p.volumeKg / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.beratKg - a.beratKg);
}

export function peringkatVolume<T extends { id: string; volumeKg: number }>(
  list: T[],
  id: string,
): number {
  return [...list].sort((a, b) => b.volumeKg - a.volumeKg).findIndex((item) => item.id === id) + 1;
}

export function nelayanAktifCount(list: Nelayan[]): number {
  return list.filter((n) => n.status === 'aktif').length;
}

export function nelayanTerverifikasiCount(list: Nelayan[]): number {
  return list.filter((n) => n.terverifikasi).length;
}

export function nelayanTergabungKoperasiCount(list: Nelayan[]): number {
  return list.filter((n) => n.koperasiId !== null).length;
}
