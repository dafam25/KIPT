export interface BiosecurityChecklistItem {
  key: string;
  label: string;
  deskripsi: string;
  options: readonly [string, string];
  problemValue: string;
}

export const BIOSECURITY_CHECKLIST_ITEMS: BiosecurityChecklistItem[] = [
  { key: 'kebersihanKapal', label: '1. Kebersihan Kapal', deskripsi: 'Kebersihan dek, palka, dan ruang mesin', options: ['Bersih', 'Kotor'], problemValue: 'Kotor' },
  { key: 'airBallast', label: '2. Air Ballast', deskripsi: 'Pemeriksaan dan pertukaran air ballast', options: ['Sesuai', 'Tidak Sesuai'], problemValue: 'Tidak Sesuai' },
  { key: 'alatTangkap', label: '3. Alat Tangkap', deskripsi: 'Kondisi dan kebersihan alat tangkap', options: ['Sesuai', 'Tidak Sesuai'], problemValue: 'Tidak Sesuai' },
  { key: 'dokumenKesehatan', label: '4. Dokumen Kesehatan', deskripsi: 'Kelengkapan dokumen kesehatan awak kapal', options: ['Lengkap', 'Tidak Lengkap'], problemValue: 'Tidak Lengkap' },
  { key: 'hamaPenyakit', label: '5. Hama & Penyakit', deskripsi: 'Hama dan penyakit berbahaya pada kapal', options: ['Tidak Ditemukan', 'Ditemukan'], problemValue: 'Ditemukan' },
  { key: 'limbahBuangan', label: '6. Limbah & Buangan', deskripsi: 'Pengelolaan limbah dan buangan kapal', options: ['Sesuai', 'Tidak Sesuai'], problemValue: 'Tidak Sesuai' },
  { key: 'awakKapal', label: '7. Awak Kapal', deskripsi: 'Pemeriksaan kesehatan awak kapal', options: ['Sehat', 'Sakit'], problemValue: 'Sakit' },
];

export function determineBiosecurityHasil(values: Record<string, string>): 'lolos' | 'tidak_lolos' {
  const bermasalah = BIOSECURITY_CHECKLIST_ITEMS.some((item) => values[item.key] === item.problemValue);
  return bermasalah ? 'tidak_lolos' : 'lolos';
}
