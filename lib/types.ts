export type KapalStatus = 'melaut' | 'sandar' | 'tidak_aktif' | 'perbaikan';
export type HasilTangkapStatus = 'verified' | 'pending';
export type NotifikasiJenis = 'peringatan' | 'informasi' | 'sukses' | 'sistem';
export type BiosecurityHasil = 'lolos' | 'tidak_lolos';

export interface Nelayan {
  id: string;
  nama: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  noHp: string;
  fotoUrl: string;
  status: 'aktif' | 'nonaktif';
  terverifikasi: boolean;
  tanggalBergabung: string;
  koperasiId: string | null;
  kapalId: string | null;
  pendamping: string;
}

export interface Kapal {
  id: string;
  nama: string;
  jenis: 'Purse Seine' | 'Longline' | 'Gillnet' | 'Kapal Motor' | 'Kapal Tanpa Motor';
  gt: number;
  mesinPk: number;
  kecepatanKnot: number;
  pelabuhanInduk: string;
  status: KapalStatus;
  posisi: { lat: number; lng: number };
  dokumen: { siup: boolean; slo: boolean; pasKecil: boolean };
  nahkodaId: string | null;
}

export interface JenisIkanTangkapan {
  nama: string;
  beratKg: number;
  jumlahEkor: number;
  kondisi: 'Segar' | 'Tidak ada hasil';
}

export interface HasilTangkap {
  id: string;
  kapalId: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  lokasi: string;
  jenisIkan: JenisIkanTangkapan[];
  estimasiNilai: number;
  status: HasilTangkapStatus;
}

export interface Koperasi {
  id: string;
  nama: string;
  lokasi: string;
  ketua: string;
  jumlahAnggota: number;
  volumeKg: number;
  nilaiTransaksi: number;
  status: 'Aktif' | 'Tidak Aktif';
}

export interface PasarIndustri {
  id: string;
  nama: string;
  jenis: 'Pasar Tradisional' | 'Pasar Modern' | 'Industri Pengolahan';
  lokasi: string;
  pengelola: string;
  volumeKg: number;
  nilaiTransaksi: number;
  status: 'Aktif' | 'Tidak Aktif';
}

export interface BiosecurityCheck {
  id: string;
  kapalId: string;
  petugas: string;
  tanggal: string;
  checklist: { label: string; hasil: string }[];
  hasil: BiosecurityHasil;
  nomorSertifikat: string;
}

export interface JadwalSandar {
  id: string;
  kapalId: string;
  tanggal: string;
  dermaga: string;
  waktuTiba: string;
  durasiJam: number;
  prioritas: 'Rendah' | 'Normal' | 'Tinggi';
}

export interface Notifikasi {
  id: string;
  jenis: NotifikasiJenis;
  judul: string;
  deskripsi: string;
  waktu: string;
  dibaca: boolean;
}
