import type { Nelayan, Kapal, HasilTangkap } from './types';

export interface SearchResult {
  id: string;
  kategori: 'Nelayan' | 'Kapal' | 'Hasil Tangkap';
  judul: string;
  subjudul: string;
  href: string;
}

export function searchGlobal(
  query: string,
  nelayan: Nelayan[],
  kapal: Kapal[],
  hasilTangkap: HasilTangkap[],
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const nelayanResults: SearchResult[] = nelayan
    .filter((n) => n.nama.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
    .map((n) => ({ id: n.id, kategori: 'Nelayan', judul: n.nama, subjudul: n.id, href: `/nelayan/${n.id}` }));

  const kapalResults: SearchResult[] = kapal
    .filter((k) => k.nama.toLowerCase().includes(q) || k.id.toLowerCase().includes(q))
    .map((k) => ({ id: k.id, kategori: 'Kapal', judul: k.nama, subjudul: k.id, href: `/kapal/${k.id}` }));

  const hasilResults: SearchResult[] = hasilTangkap
    .filter((h) => h.id.toLowerCase().includes(q) || h.lokasi.toLowerCase().includes(q))
    .map((h) => ({ id: h.id, kategori: 'Hasil Tangkap', judul: h.lokasi, subjudul: h.id, href: '/hasil-tangkap' }));

  return [...nelayanResults, ...kapalResults, ...hasilResults];
}
