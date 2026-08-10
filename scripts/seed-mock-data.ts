// scripts/seed-mock-data.ts
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import { nextNelayanId, nextKapalId, nextBiosecurityId } from '../lib/id';
import type { Kapal, Nelayan, HasilTangkap, Koperasi, PasarIndustri, Notifikasi, JadwalSandar, BiosecurityCheck, TiketBantuan } from '../lib/types';
import { JENIS_IKAN_OPTIONS } from '../lib/jenis-ikan';
import { BIOSECURITY_CHECKLIST_ITEMS, determineBiosecurityHasil } from '../lib/biosecurity';

faker.seed(20250510); // fixed seed so the dataset is stable across re-runs
const SEED_DATE = new Date('2025-05-10T00:00:00Z'); // fixed "today" (10 Mei 2025, UTC) so generated IDs/dates are stable across re-runs regardless of machine timezone

// Indonesian name/place pools — replace Faker's Western-locale generators (person.fullName,
// location.city/state/county, company.name, location.streetAddress) so reseeding can never
// reintroduce foreign names, cities, provinces, or organizations. Several values are sourced
// from the project's own design-mockup slides (e.g. "Budi Santoso", "KM. Bahari Jaya").
const NAMA_DEPAN_PRIA = [
  'Budi', 'Agus', 'Ahmad', 'Bambang', 'Slamet', 'Wahyu', 'Eko', 'Hendra', 'Rudi', 'Dedi',
  'Asep', 'Yusuf', 'Fajar', 'Hadi', 'Iwan', 'Rizki', 'Andi', 'Dwi', 'Teguh', 'Bayu',
  'Fauzi', 'Irfan', 'Taufik', 'Herman', 'Suryadi', 'Gunawan', 'Hasan', 'Rahman', 'Setiawan', 'Nugroho',
  'Wibowo', 'Kurniawan', 'Prasetyo', 'Ramadhan', 'Firmansyah', 'Maulana', 'Syahrul', 'Arif', 'Yudi', 'Bagus',
  'Sugianto', 'Zainal', 'Mukti', 'Hidayat', 'Aditya', 'Wisnu', 'Rizal', 'Fadli', 'Ilham', 'Sutrisno',
];
const NAMA_DEPAN_WANITA = [
  'Siti', 'Ani', 'Dewi', 'Rina', 'Sri', 'Yuni', 'Fitri', 'Indah', 'Lestari', 'Ratna',
  'Puspita', 'Wulandari', 'Kartika', 'Melati', 'Nur', 'Aminah', 'Wahyuni', 'Suryani', 'Astuti', 'Rahayu',
  'Yanti', 'Novi', 'Diah', 'Ayu', 'Anisa', 'Maya', 'Dian', 'Tuti', 'Widiastuti', 'Hasanah',
  'Kusuma', 'Wardani', 'Handayani', 'Susanti', 'Rahmawati', 'Oktaviani', 'Purnama', 'Cahyani', 'Utami', 'Yulianti',
];
const NAMA_BELAKANG = [
  'Santoso', 'Wijaya', 'Kusuma', 'Setiawan', 'Susanto', 'Purnomo', 'Saputra', 'Hidayat', 'Firmansyah', 'Gunawan',
  'Wibowo', 'Nugraha', 'Pratama', 'Permana', 'Ramadhan', 'Kurniawan', 'Hartono', 'Suhendra', 'Iskandar', 'Rasyid',
  'Wibisono', 'Halim', 'Suryanto', 'Prakoso', 'Wahyudi', 'Rahmadi', 'Aprianto', 'Ashari', 'Utomo', 'Sudrajat',
  'Handoko', 'Wirawan', 'Yulianto', 'Kuncoro', 'Sasongko', 'Wardhana', 'Atmaja', 'Winarno', 'Sudibyo', 'Setyawan',
  'Nasution', 'Siregar', 'Simanjuntak', 'Harahap', 'Lubis', 'Marpaung', 'Sinaga', 'Tanjung', 'Rangkuti', 'Daulay',
];
function namaLengkap(): string {
  const depan = faker.helpers.arrayElement(faker.datatype.boolean() ? NAMA_DEPAN_PRIA : NAMA_DEPAN_WANITA);
  const belakang = faker.helpers.arrayElement(NAMA_BELAKANG);
  return `${depan} ${belakang}`;
}

const KOTA_PESISIR = [
  'Banyuwangi', 'Jember', 'Situbondo', 'Probolinggo', 'Pasuruan', 'Lamongan', 'Tuban', 'Gresik', 'Sidoarjo', 'Rembang',
  'Pati', 'Jepara', 'Pekalongan', 'Tegal', 'Cirebon', 'Indramayu', 'Subang', 'Karawang', 'Cilacap', 'Kebumen',
  'Kendal', 'Demak', 'Pemalang', 'Batang', 'Brebes', 'Serang', 'Pandeglang', 'Bengkulu', 'Palembang', 'Pangkal Pinang',
  'Tanjung Pinang', 'Dumai', 'Bagansiapiapi', 'Sibolga', 'Padang', 'Pariaman', 'Bengkalis', 'Tembilahan', 'Bandar Lampung', 'Kalianda',
  'Belitung', 'Pontianak', 'Singkawang', 'Sambas', 'Ketapang', 'Banjarmasin', 'Sampit', 'Kotabaru', 'Balikpapan', 'Bontang',
  'Tarakan', 'Nunukan', 'Jembrana', 'Buleleng', 'Karangasem', 'Klungkung', 'Bima', 'Dompu', 'Sumbawa', 'Kupang',
  'Ende', 'Maumere', 'Larantuka', 'Bau-Bau', 'Kendari', 'Bulukumba', 'Bantaeng', 'Pare-Pare', 'Palopo', 'Luwuk',
  'Gorontalo', 'Bitung', 'Manado', 'Ternate', 'Tidore', 'Sorong', 'Fakfak', 'Biak', 'Merauke', 'Ambon',
];
const NAMA_DUSUN_DESA = [
  'Sukamaju', 'Sumberejo', 'Karangrejo', 'Sidomulyo', 'Sumberagung', 'Tambakrejo', 'Wonosari', 'Sumberjo', 'Kalibaru', 'Sidorejo',
  'Sukorejo', 'Bangunrejo', 'Tegalsari', 'Sumbermulyo', 'Karangsari', 'Banjarsari', 'Sukajaya', 'Mekarsari', 'Tanjungsari', 'Sukaraja',
  'Cintamulya', 'Sumberwaru', 'Karanganyar', 'Sidoharjo',
];
function alamatNelayan(): string {
  const dusun = faker.helpers.arrayElement(NAMA_DUSUN_DESA);
  const desa = faker.helpers.arrayElement(NAMA_DUSUN_DESA);
  const rt = String(faker.number.int({ min: 1, max: 12 })).padStart(2, '0');
  const rw = String(faker.number.int({ min: 1, max: 8 })).padStart(2, '0');
  return `Dusun ${dusun}, Desa ${desa}, RT ${rt}/RW ${rw}`;
}

const KAPAL_NAMA_DEPAN = [
  'Bahari', 'Samudra', 'Mina', 'Cahaya', 'Sinar', 'Bintang', 'Mutiara', 'Karya', 'Sumber', 'Anugerah',
  'Berkah', 'Nusantara', 'Mitra', 'Putra', 'Cakrawala', 'Tunas', 'Harapan', 'Sentosa',
];
const KAPAL_NAMA_BELAKANG = [
  'Jaya', 'Indah', 'Sejati', 'Makmur', 'Abadi', 'Mandiri', 'Bahari', 'Sentosa', 'Sejahtera', 'Utama',
  'Bersama', 'Perkasa', 'Laut', 'Bahtera', 'Samudra', 'Rejeki', 'Sakti', 'Persada',
];
function namaKapal(existing: Set<string>): string {
  let depan: string;
  let belakang: string;
  let nama: string;
  do {
    depan = faker.helpers.arrayElement(KAPAL_NAMA_DEPAN);
    belakang = faker.helpers.arrayElement(KAPAL_NAMA_BELAKANG);
    nama = `KM. ${depan} ${belakang}`;
  } while (depan === belakang || existing.has(nama));
  existing.add(nama);
  return nama;
}

const PERAIRAN_NAMA = [
  'Utara Jawa', 'Selat Bali', 'Selat Sunda', 'Laut Jawa', 'Laut Flores', 'Laut Banda', 'Laut Arafura', 'Selat Makassar',
  'Laut Sulawesi', 'Laut Maluku', 'Selat Malaka', 'Laut Natuna', 'Teluk Tomini', 'Laut Seram', 'Selat Karimata', 'Laut Sawu',
  'Teluk Cendrawasih', 'Laut Timor', 'Selat Lombok', 'Teluk Tolo', 'Laut Halmahera', 'Selat Berhala',
];

const JENIS_KAPAL: Kapal['jenis'][] = ['Purse Seine', 'Longline', 'Gillnet', 'Kapal Motor', 'Kapal Tanpa Motor'];
const PELABUHAN = ['PPP Muncar', 'PPI Banyuwangi', 'TPI Jakarta', 'Pelabuhan TPI Bitung', 'TPI Surabaya', 'TPI Benoa'];
const DERMAGA = ['Dermaga 01', 'Dermaga 02', 'Dermaga 03'];

const kapalIds: string[] = [];
const usedKapalNama = new Set<string>();
const kapalData: Kapal[] = Array.from({ length: 40 }, () => {
  const id = nextKapalId(kapalIds, SEED_DATE);
  kapalIds.push(id);
  return {
    id,
    nama: namaKapal(usedKapalNama),
    jenis: faker.helpers.arrayElement(JENIS_KAPAL),
    gt: faker.number.int({ min: 5, max: 120 }),
    mesinPk: faker.number.int({ min: 25, max: 250 }),
    kecepatanKnot: faker.number.int({ min: 8, max: 25 }),
    pelabuhanInduk: faker.helpers.arrayElement(PELABUHAN),
    status: faker.helpers.arrayElement(['melaut', 'sandar', 'tidak_aktif', 'perbaikan']),
    posisi: { lat: faker.number.float({ min: -8.9, max: 5.9, fractionDigits: 4 }), lng: faker.number.float({ min: 95.0, max: 141.0, fractionDigits: 4 }) },
    dokumen: { siup: true, slo: faker.datatype.boolean(), pasKecil: faker.datatype.boolean() },
    nahkodaId: null,
  };
});

// Fixed pool of real Indonesian koperasi names/locations/ketua, paired 1:1 by index, so
// reseeding can never reintroduce Faker's fake Western company names or "{City}, {State}"
// locations. Several names and the first eight locations are taken from the project's own
// design-mockup slides; the remaining locations/names extend the same style nationwide.
const KOPERASI_NAMA = [
  'Koperasi Bahari Sejahtera',
  'Koperasi Samudra Jaya',
  'Koperasi Mina Mandiri',
  'Koperasi Laut Makmur',
  'Koperasi Nelayan Sejati',
  'Koperasi Harapan Baru',
  'Koperasi Cakrawala Bahari',
  'Koperasi Tunas Bahari',
  'Koperasi Mina Sejahtera',
  'Koperasi Bahari Minang',
  'Koperasi Mitra Bahari',
  'Koperasi Nusa Bahari',
  'Koperasi Papua Bahari',
  'Koperasi Lombok Bahari',
  'Koperasi Teluk Palu Sejahtera',
];
const KOPERASI_LOKASI = [
  'Jakarta Utara, DKI Jakarta',
  'Tanjung Perak, Jawa Timur',
  'Bitung, Sulawesi Utara',
  'Benoa, Bali',
  'Belawan, Sumatera Utara',
  'Kendari, Sulawesi Tenggara',
  'Pontianak, Kalimantan Barat',
  'Ambon, Maluku',
  'Cirebon, Jawa Barat',
  'Padang, Sumatera Barat',
  'Balikpapan, Kalimantan Timur',
  'Kupang, Nusa Tenggara Timur',
  'Sorong, Papua Barat Daya',
  'Mataram, Nusa Tenggara Barat',
  'Palu, Sulawesi Tengah',
];
const KOPERASI_KETUA = [
  'Budi Santoso',
  'Joko Susanto',
  'Andi Rahman',
  'I Made Suarta',
  'Slamet Riyadi',
  'La Ode Hasan',
  'Suryadi',
  'Abdul Latif',
  'Dedi Kurniawan',
  'Zulfikar',
  'Rahmat Hidayat',
  'Yohanes Bili',
  'Yustus Kaisiepo',
  'Lalu Wirawan',
  'Muhammad Yusri',
];

const koperasiData: Koperasi[] = Array.from({ length: 15 }, (_, i) => ({
  id: faker.string.uuid(),
  nama: KOPERASI_NAMA[i],
  lokasi: KOPERASI_LOKASI[i],
  ketua: KOPERASI_KETUA[i],
  jumlahAnggota: faker.number.int({ min: 30, max: 300 }),
  volumeKg: faker.number.int({ min: 1000, max: 15000 }),
  nilaiTransaksi: faker.number.int({ min: 50_000_000, max: 400_000_000 }),
  status: faker.helpers.arrayElement(['Aktif', 'Aktif', 'Aktif', 'Tidak Aktif']),
}));

const nelayanIds: string[] = [];
const nelayanData: Nelayan[] = Array.from({ length: 60 }, () => {
  const id = nextNelayanId(nelayanIds, SEED_DATE);
  nelayanIds.push(id);
  const kapal = faker.helpers.arrayElement(kapalData);
  return {
    id,
    nama: namaLengkap(),
    nik: faker.string.numeric(16),
    tempatLahir: faker.helpers.arrayElement(KOTA_PESISIR),
    tanggalLahir: faker.date.birthdate({ min: 25, max: 60, mode: 'age', refDate: SEED_DATE }).toISOString().slice(0, 10),
    alamat: alamatNelayan(),
    noHp: `08${faker.string.numeric(9)}`,
    fotoUrl: '',
    status: faker.helpers.arrayElement(['aktif', 'aktif', 'nonaktif']),
    terverifikasi: faker.datatype.boolean(),
    tanggalBergabung: faker.date.past({ years: 3, refDate: SEED_DATE }).toISOString().slice(0, 10),
    koperasiId: faker.helpers.arrayElement(koperasiData).id,
    kapalId: kapal.id,
    pendamping: namaLengkap(),
  };
});

nelayanData.forEach((n) => {
  const kapal = kapalData.find((k) => k.id === n.kapalId);
  if (kapal && !kapal.nahkodaId) kapal.nahkodaId = n.id;
});

// Fixed pool of real Indonesian market/industry names paired 1:1 by index with
// PASAR_INDUSTRI_LOKASI below, so reseeding can never reintroduce Faker's fake
// American-style "Pasar Ikan {City}" names or "{City}, {State}" locations.
// Sourced from real Indonesian fish-market/port names (several taken from the
// project's own design-mockup slides) plus plausible modern-market naming for
// the remainder, chosen for realistic full-archipelago spread.
const PASAR_INDUSTRI_NAMA = [
  'Pasar Ikan Muara Baru',
  'Pasar Ikan Modern BSD',
  'Pasar Ikan Modern Kenjeran',
  'Pasar Ikan Jembatan Puri',
  'Pasar Ikan Modern Semarang',
  'Pasar Ikan Kedonganan',
  'Pasar Ikan Paotere',
  'Pasar Ikan Higienis Bandung',
  'Pasar Ikan Belawan',
  'Industri Pengolahan Ikan Musi Jaya',
  'Pasar Ikan Modern Banjarmasin',
  'Industri Pengolahan Ikan Manado Jaya',
];
const PASAR_INDUSTRI_LOKASI = [
  'Jakarta Utara, DKI Jakarta',
  'Tangerang Selatan, Banten',
  'Surabaya, Jawa Timur',
  'Jakarta Barat, DKI Jakarta',
  'Semarang, Jawa Tengah',
  'Badung, Bali',
  'Makassar, Sulawesi Selatan',
  'Bandung, Jawa Barat',
  'Medan, Sumatera Utara',
  'Palembang, Sumatera Selatan',
  'Banjarmasin, Kalimantan Selatan',
  'Manado, Sulawesi Utara',
];

// Fixed pool of real Indonesian market-operator names, paired 1:1 by index with the arrays
// above (several taken from the project's own design-mockup slides), so reseeding can never
// reintroduce Faker's fake Western company names (e.g. "Lakin - Aufderhar", "Lynch Inc").
const PASAR_INDUSTRI_PENGELOLA = [
  'Perumda Pasar Jaya',
  'PT. Modern Market',
  'PT. Bahari Sejahtera',
  'Perumda Pasar Jaya',
  'PT. Samudra Food',
  'UPTD Pasar Badung',
  'PT. Nusantara Canning',
  'PD Pasar Bermartabat',
  'PT. Belawan Bahari Nusantara',
  'PT. Musi Jaya Perikanan',
  'PT. Banjar Mina Sejahtera',
  'PT. Manado Bahari Lestari',
];

const pasarIndustriData: PasarIndustri[] = Array.from({ length: 12 }, (_, i) => ({
  id: faker.string.uuid(),
  nama: PASAR_INDUSTRI_NAMA[i],
  jenis: faker.helpers.arrayElement(['Pasar Tradisional', 'Pasar Modern', 'Industri Pengolahan']),
  lokasi: PASAR_INDUSTRI_LOKASI[i],
  pengelola: PASAR_INDUSTRI_PENGELOLA[i],
  volumeKg: faker.number.int({ min: 2000, max: 20000 }),
  nilaiTransaksi: faker.number.int({ min: 80_000_000, max: 800_000_000 }),
  status: faker.helpers.arrayElement(['Aktif', 'Aktif', 'Tidak Aktif']),
}));

const hasilTangkapData: HasilTangkap[] = Array.from({ length: 80 }, () => {
  const kapal = faker.helpers.arrayElement(kapalData);
  const jenisIkan = faker.helpers.arrayElements(JENIS_IKAN_OPTIONS, { min: 1, max: 4 }).map((nama) => ({
    nama,
    beratKg: faker.number.int({ min: 20, max: 200 }),
    jumlahEkor: faker.number.int({ min: 20, max: 150 }),
    kondisi: 'Segar' as const,
  }));
  return {
    id: faker.string.uuid(),
    kapalId: kapal.id,
    tanggal: faker.date.recent({ days: 30, refDate: SEED_DATE }).toISOString().slice(0, 10),
    waktuMulai: '06:00',
    waktuSelesai: '12:00',
    lokasi: `Perairan ${faker.helpers.arrayElement(PERAIRAN_NAMA)}`,
    jenisIkan,
    estimasiNilai: jenisIkan.reduce((sum, j) => sum + j.beratKg * 25000, 0),
    status: faker.helpers.arrayElement(['verified', 'verified', 'pending']),
  };
});

const notifikasiData: Notifikasi[] = Array.from({ length: 20 }, () => ({
  id: faker.string.uuid(),
  jenis: faker.helpers.arrayElement(['peringatan', 'informasi', 'sukses', 'sistem']),
  judul: faker.lorem.sentence(4),
  deskripsi: faker.lorem.sentence(10),
  waktu: faker.date.recent({ days: 5, refDate: SEED_DATE }).toISOString(),
  dibaca: faker.datatype.boolean(),
}));

const jadwalSandarData: JadwalSandar[] = Array.from({ length: 20 }, () => {
  const kapal = faker.helpers.arrayElement(kapalData);
  const jam = faker.number.int({ min: 6, max: 20 });
  return {
    id: faker.string.uuid(),
    kapalId: kapal.id,
    tanggal: faker.date.soon({ days: 14, refDate: SEED_DATE }).toISOString().slice(0, 10),
    dermaga: faker.helpers.arrayElement(DERMAGA),
    waktuTiba: `${String(jam).padStart(2, '0')}:${faker.helpers.arrayElement(['00', '15', '30', '45'])}`,
    durasiJam: faker.number.int({ min: 2, max: 6 }),
    prioritas: faker.helpers.arrayElement(['Rendah', 'Normal', 'Normal', 'Tinggi']),
  };
});

const biosecurityIds: string[] = [];
const biosecurityCheckData: BiosecurityCheck[] = Array.from({ length: 15 }, () => {
  const kapal = faker.helpers.arrayElement(kapalData);
  const tanggal = faker.date.recent({ days: 20, refDate: SEED_DATE });
  const values: Record<string, string> = {};
  for (const item of BIOSECURITY_CHECKLIST_ITEMS) {
    values[item.key] = faker.helpers.weightedArrayElement([
      { weight: 12, value: item.options.find((o) => o !== item.problemValue)! },
      { weight: 1, value: item.problemValue },
    ]);
  }
  const id = nextBiosecurityId(biosecurityIds, tanggal);
  biosecurityIds.push(id);
  return {
    id,
    kapalId: kapal.id,
    petugas: `${namaLengkap()}, A.Md`,
    tanggal: tanggal.toISOString().slice(0, 10),
    checklist: BIOSECURITY_CHECKLIST_ITEMS.map((item) => ({ label: item.label, hasil: values[item.key] })),
    hasil: determineBiosecurityHasil(values),
    nomorSertifikat: id,
  };
});

const KATEGORI_TIKET: TiketBantuan['kategori'][] = ['Teknis', 'Akun', 'Data', 'Lainnya'];
const STATUS_TIKET: TiketBantuan['status'][] = ['Terbuka', 'Diproses', 'Selesai'];

const tiketBantuanData: TiketBantuan[] = Array.from({ length: 6 }, () => ({
  id: faker.string.uuid(),
  judul: faker.lorem.sentence({ min: 4, max: 8 }),
  kategori: faker.helpers.arrayElement(KATEGORI_TIKET),
  deskripsi: faker.lorem.sentences(2),
  status: faker.helpers.arrayElement(STATUS_TIKET),
  dibuatPada: faker.date.recent({ days: 20, refDate: SEED_DATE }).toISOString(),
}));

function writeModule(fileName: string, exportName: string, typeName: string, data: unknown) {
  const filePath = path.join(__dirname, '..', 'lib', 'mock-data', fileName);
  const contents = `// Generated by scripts/seed-mock-data.ts — do not edit by hand.\nimport type { ${typeName} } from '../types';\n\nexport const ${exportName}: ${typeName}[] = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(filePath, contents);
  console.log(`Wrote ${filePath}`);
}

writeModule('kapal.ts', 'kapalData', 'Kapal', kapalData);
writeModule('nelayan.ts', 'nelayanData', 'Nelayan', nelayanData);
writeModule('koperasi.ts', 'koperasiData', 'Koperasi', koperasiData);
writeModule('pasar-industri.ts', 'pasarIndustriData', 'PasarIndustri', pasarIndustriData);
writeModule('hasil-tangkap.ts', 'hasilTangkapData', 'HasilTangkap', hasilTangkapData);
writeModule('notifikasi.ts', 'notifikasiData', 'Notifikasi', notifikasiData);
writeModule('jadwal-sandar.ts', 'jadwalSandarData', 'JadwalSandar', jadwalSandarData);
writeModule('biosecurity-check.ts', 'biosecurityCheckData', 'BiosecurityCheck', biosecurityCheckData);
writeModule('tiket-bantuan.ts', 'tiketBantuanData', 'TiketBantuan', tiketBantuanData);
