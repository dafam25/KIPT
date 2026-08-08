// scripts/seed-mock-data.ts
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import { nextNelayanId, nextKapalId } from '../lib/id';
import type { Kapal, Nelayan, HasilTangkap, Koperasi, PasarIndustri, Notifikasi, JadwalSandar } from '../lib/types';

faker.seed(20250510); // fixed seed so the dataset is stable across re-runs
const SEED_DATE = new Date('2025-05-10T00:00:00Z'); // fixed "today" (10 Mei 2025, UTC) so generated IDs/dates are stable across re-runs regardless of machine timezone

const JENIS_KAPAL: Kapal['jenis'][] = ['Purse Seine', 'Longline', 'Gillnet', 'Kapal Motor', 'Kapal Tanpa Motor'];
const IKAN = ['Ikan Tongkol', 'Ikan Cakalang', 'Ikan Kembung', 'Ikan Tuna', 'Ikan Layang', 'Ikan Tenggiri'];
const PELABUHAN = ['PPP Muncar', 'PPI Banyuwangi', 'TPI Jakarta', 'Pelabuhan TPI Bitung', 'TPI Surabaya', 'TPI Benoa'];
const DERMAGA = ['Dermaga 01', 'Dermaga 02', 'Dermaga 03'];

const kapalIds: string[] = [];
const kapalData: Kapal[] = Array.from({ length: 40 }, () => {
  const id = nextKapalId(kapalIds, SEED_DATE);
  kapalIds.push(id);
  return {
    id,
    nama: `KM. ${faker.person.lastName()} ${faker.word.adjective()}`,
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

const koperasiData: Koperasi[] = Array.from({ length: 15 }, () => ({
  id: faker.string.uuid(),
  nama: `Koperasi ${faker.company.name()}`,
  lokasi: `${faker.location.city()}, ${faker.location.state()}`,
  ketua: faker.person.fullName(),
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
    nama: faker.person.fullName(),
    nik: faker.string.numeric(16),
    tempatLahir: faker.location.city(),
    tanggalLahir: faker.date.birthdate({ min: 25, max: 60, mode: 'age', refDate: SEED_DATE }).toISOString().slice(0, 10),
    alamat: faker.location.streetAddress({ useFullAddress: true }),
    noHp: `08${faker.string.numeric(9)}`,
    fotoUrl: '',
    status: faker.helpers.arrayElement(['aktif', 'aktif', 'nonaktif']),
    terverifikasi: faker.datatype.boolean(),
    tanggalBergabung: faker.date.past({ years: 3, refDate: SEED_DATE }).toISOString().slice(0, 10),
    koperasiId: faker.helpers.arrayElement(koperasiData).id,
    kapalId: kapal.id,
    pendamping: faker.person.fullName(),
  };
});

nelayanData.forEach((n) => {
  const kapal = kapalData.find((k) => k.id === n.kapalId);
  if (kapal && !kapal.nahkodaId) kapal.nahkodaId = n.id;
});

const pasarIndustriData: PasarIndustri[] = Array.from({ length: 12 }, () => ({
  id: faker.string.uuid(),
  nama: `Pasar Ikan ${faker.location.city()}`,
  jenis: faker.helpers.arrayElement(['Pasar Tradisional', 'Pasar Modern', 'Industri Pengolahan']),
  lokasi: `${faker.location.city()}, ${faker.location.state()}`,
  pengelola: faker.company.name(),
  volumeKg: faker.number.int({ min: 2000, max: 20000 }),
  nilaiTransaksi: faker.number.int({ min: 80_000_000, max: 800_000_000 }),
  status: faker.helpers.arrayElement(['Aktif', 'Aktif', 'Tidak Aktif']),
}));

const hasilTangkapData: HasilTangkap[] = Array.from({ length: 80 }, () => {
  const kapal = faker.helpers.arrayElement(kapalData);
  const jenisIkan = faker.helpers.arrayElements(IKAN, { min: 1, max: 4 }).map((nama) => ({
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
    lokasi: `Perairan ${faker.location.county()}`,
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
