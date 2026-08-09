'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Database, Wrench, AlertTriangle, FileText, Search, HelpCircle, Ticket, ShieldCheck, Mail, Phone, Clock, ChevronRight } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toastManager } from '@/components/ui/toast';
import type { TiketBantuan, TiketKategori, TiketStatus } from '@/lib/types';
import { generateLocalId } from '@/lib/id';
import { formatDate, formatNumber } from '@/lib/format';

type FaqKategori = 'Akun & Akses' | 'Data & Informasi' | 'Fitur & Layanan' | 'Teknis & Error' | 'Kebijakan & Regulasi';

const FAQ_ITEMS: { pertanyaan: string; jawaban: string; kategori: FaqKategori }[] = [
  {
    pertanyaan: 'Bagaimana cara mendaftarkan nelayan baru ke sistem?',
    jawaban: 'Buka halaman Nelayan, lalu isi data nelayan melalui menu tambah data. Setelah tersimpan, data akan langsung muncul di daftar nelayan terdaftar.',
    kategori: 'Fitur & Layanan',
  },
  {
    pertanyaan: 'Apa yang dimaksud dengan pemeriksaan biosecurity?',
    jawaban: 'Pemeriksaan biosecurity adalah proses verifikasi kondisi kapal dan kru sebelum melaut untuk mencegah penyebaran penyakit dan menjaga kualitas hasil tangkapan. Hasil pemeriksaan berupa status Lolos atau Tidak Lolos.',
    kategori: 'Data & Informasi',
  },
  {
    pertanyaan: 'Bagaimana cara mengekspor laporan ke format CSV?',
    jawaban: 'Buka halaman Laporan & Analitik, pilih kategori laporan yang diinginkan, lalu klik tombol Export Laporan di bagian atas halaman.',
    kategori: 'Fitur & Layanan',
  },
  {
    pertanyaan: 'Mengapa posisi kapal di peta tracking selalu berubah?',
    jawaban: 'Posisi kapal disimulasikan agar terlihat seperti data real-time. Pada implementasi produksi, data ini akan berasal dari perangkat GPS/AIS yang terpasang di kapal.',
    kategori: 'Teknis & Error',
  },
  {
    pertanyaan: 'Apakah data yang saya masukkan akan tersimpan setelah refresh halaman?',
    jawaban: 'Belum. Versi ini menyimpan data pada sesi browser saja (belum terhubung ke database), sehingga data akan kembali ke kondisi awal setelah halaman dimuat ulang.',
    kategori: 'Teknis & Error',
  },
  {
    pertanyaan: 'Bagaimana cara menghubungi tim dukungan jika tiket belum direspons?',
    jawaban: 'Ajukan tiket baru melalui formulir di halaman ini dengan kategori yang sesuai. Tim dukungan akan memperbarui status tiket menjadi Diproses atau Selesai.',
    kategori: 'Fitur & Layanan',
  },
  {
    pertanyaan: 'Bagaimana cara mengubah nama akun atau informasi profil saya?',
    jawaban: 'Belum tersedia. Versi ini belum memiliki sistem akun multi-pengguna — seluruh akses saat ini menggunakan satu akun Admin DKP bersama.',
    kategori: 'Akun & Akses',
  },
  {
    pertanyaan: 'Bagaimana kebijakan penyimpanan dan keamanan data pada sistem ini?',
    jawaban: 'Versi ini adalah purwarupa (prototype) yang menyimpan data pada sesi browser saja, belum terhubung ke database maupun kebijakan retensi data resmi. Kebijakan keamanan dan regulasi lengkap akan ditetapkan sebelum sistem digunakan secara produksi.',
    kategori: 'Kebijakan & Regulasi',
  },
];

const KATEGORI_BANTUAN: { value: FaqKategori; label: string; icon: typeof User }[] = [
  { value: 'Akun & Akses', label: 'Akun & Akses', icon: User },
  { value: 'Data & Informasi', label: 'Data & Informasi', icon: Database },
  { value: 'Fitur & Layanan', label: 'Fitur & Layanan', icon: Wrench },
  { value: 'Teknis & Error', label: 'Teknis & Error', icon: AlertTriangle },
  { value: 'Kebijakan & Regulasi', label: 'Kebijakan & Regulasi', icon: FileText },
];

const KATEGORI_OPTIONS: TiketKategori[] = ['Teknis', 'Akun', 'Data', 'Lainnya'];

const STATUS_TONE: Record<TiketStatus, 'warning' | 'info' | 'success'> = {
  Terbuka: 'warning',
  Diproses: 'info',
  Selesai: 'success',
};

export default function BantuanPage() {
  const { tiketBantuan, addTiketBantuan } = useData();
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<FaqKategori | null>(null);

  const faqTersaring = FAQ_ITEMS.filter(
    (item) =>
      (!kategoriFilter || item.kategori === kategoriFilter) &&
      (search.trim() === '' ||
        item.pertanyaan.toLowerCase().includes(search.toLowerCase()) ||
        item.jawaban.toLowerCase().includes(search.toLowerCase())),
  );
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<TiketKategori>('Teknis');
  const [deskripsi, setDeskripsi] = useState('');
  const [error, setError] = useState('');

  const tiketUrut = [...tiketBantuan].sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada));

  const columns: DataTableColumn<TiketBantuan>[] = [
    { header: 'Judul', cell: (t) => t.judul },
    { header: 'Kategori', cell: (t) => t.kategori },
    { header: 'Status', cell: (t) => <StatusBadge label={t.status} tone={STATUS_TONE[t.status]} /> },
    { header: 'Tanggal Dibuat', cell: (t) => formatDate(t.dibuatPada.slice(0, 10)) },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim()) {
      setError('Judul dan deskripsi tiket wajib diisi.');
      return;
    }
    addTiketBantuan({
      id: generateLocalId('TIK'),
      judul: judul.trim(),
      kategori,
      deskripsi: deskripsi.trim(),
      status: 'Terbuka',
      dibuatPada: new Date().toISOString(),
    });
    setJudul('');
    setKategori('Teknis');
    setDeskripsi('');
    setError('');
    toastManager.add({ title: 'Tiket berhasil diajukan', description: 'Tim dukungan akan segera meninjau tiket Anda.' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bantuan' }]}
        title="Bantuan"
        description="Pusat bantuan, pertanyaan umum, dan pengajuan tiket dukungan"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={HelpCircle} label="Jam Layanan" value="Sen-Jum" accent="blue" />
        <KpiCard icon={HelpCircle} label="FAQ Tersedia" value={formatNumber(FAQ_ITEMS.length)} accent="green" />
        <KpiCard icon={Ticket} label="Tiket Saya" value={formatNumber(tiketBantuan.length)} accent="cyan" />
        <KpiCard icon={ShieldCheck} label="Status Layanan" value="Normal" accent="purple" />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari bantuan, panduan, atau topik..."
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {KATEGORI_BANTUAN.map((kat) => {
              const Icon = kat.icon;
              const active = kategoriFilter === kat.value;
              return (
                <button
                  key={kat.value}
                  type="button"
                  onClick={() => setKategoriFilter(active ? null : kat.value)}
                  className={
                    active
                      ? 'flex flex-col items-center gap-2 rounded-lg border border-primary bg-primary/10 p-4 text-center'
                      : 'flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center hover:bg-muted/40'
                  }
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">{kat.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">
          Pertanyaan yang Sering Diajukan
          {kategoriFilter && <span className="ml-2 font-normal text-muted-foreground">— {kategoriFilter}</span>}
        </CardHeader>
        <CardContent>
          {faqTersaring.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada FAQ yang cocok.</p>
          ) : (
            <Accordion>
              {faqTersaring.map((item) => (
                <AccordionItem key={item.pertanyaan} value={item.pertanyaan}>
                  <AccordionTrigger>{item.pertanyaan}</AccordionTrigger>
                  <AccordionContent>{item.jawaban}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
      <Card>
        <CardHeader className="text-sm font-semibold">Tiket Dukungan ({tiketBantuan.length})</CardHeader>
        <CardContent>
          <DataTable data={tiketUrut} columns={columns} getRowKey={(t) => t.id} pageSize={10} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">Ajukan Tiket Baru</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="tiket-judul" className="text-sm text-muted-foreground">Judul</label>
              <Input id="tiket-judul" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Ringkasan singkat masalah Anda" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tiket-kategori" className="text-sm text-muted-foreground">Kategori</label>
              <Select
                items={KATEGORI_OPTIONS.map((k) => ({ value: k, label: k }))}
                value={kategori}
                onValueChange={(v) => setKategori((v ?? 'Teknis') as TiketKategori)}
              >
                <SelectTrigger id="tiket-kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="tiket-deskripsi" className="text-sm text-muted-foreground">Deskripsi</label>
              <Textarea
                id="tiket-deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan masalah Anda secara detail"
              />
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit">Ajukan Tiket</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="text-sm font-semibold">Hubungi Kami</CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">bantuan@dkp.go.id</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Telepon</p>
                <p className="text-muted-foreground">(021) 1234 5678</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Jam Operasional</p>
                <p className="text-muted-foreground">Senin - Jumat, 08:00 - 17:00 WIB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-sm font-semibold">Panduan Cepat</CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: 'Cara Melacak Kapal', href: '/peta-tracking' },
              { label: 'Cara Input Hasil Tangkapan', href: '/hasil-tangkap/input' },
              { label: 'Cara Cek Biosecurity', href: '/hasil-tangkap/biosecurity' },
              { label: 'Cara Membuat Laporan', href: '/laporan' },
              { label: 'Kelola Data Nelayan', href: '/nelayan' },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted/40"
              >
                {guide.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
