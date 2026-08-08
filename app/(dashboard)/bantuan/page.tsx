'use client';

import { useState } from 'react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toastManager } from '@/components/ui/toast';
import type { TiketBantuan, TiketKategori, TiketStatus } from '@/lib/types';
import { generateLocalId } from '@/lib/id';
import { formatDate } from '@/lib/format';

const FAQ_ITEMS: { pertanyaan: string; jawaban: string }[] = [
  {
    pertanyaan: 'Bagaimana cara mendaftarkan nelayan baru ke sistem?',
    jawaban: 'Buka halaman Nelayan, lalu isi data nelayan melalui menu tambah data. Setelah tersimpan, data akan langsung muncul di daftar nelayan terdaftar.',
  },
  {
    pertanyaan: 'Apa yang dimaksud dengan pemeriksaan biosecurity?',
    jawaban: 'Pemeriksaan biosecurity adalah proses verifikasi kondisi kapal dan kru sebelum melaut untuk mencegah penyebaran penyakit dan menjaga kualitas hasil tangkapan. Hasil pemeriksaan berupa status Lolos atau Tidak Lolos.',
  },
  {
    pertanyaan: 'Bagaimana cara mengekspor laporan ke format CSV?',
    jawaban: 'Buka halaman Laporan & Analitik, pilih kategori laporan yang diinginkan, lalu klik tombol Export Laporan di bagian atas halaman.',
  },
  {
    pertanyaan: 'Mengapa posisi kapal di peta tracking selalu berubah?',
    jawaban: 'Posisi kapal disimulasikan agar terlihat seperti data real-time. Pada implementasi produksi, data ini akan berasal dari perangkat GPS/AIS yang terpasang di kapal.',
  },
  {
    pertanyaan: 'Apakah data yang saya masukkan akan tersimpan setelah refresh halaman?',
    jawaban: 'Belum. Versi ini menyimpan data pada sesi browser saja (belum terhubung ke database), sehingga data akan kembali ke kondisi awal setelah halaman dimuat ulang.',
  },
  {
    pertanyaan: 'Bagaimana cara menghubungi tim dukungan jika tiket belum direspons?',
    jawaban: 'Ajukan tiket baru melalui formulir di halaman ini dengan kategori yang sesuai. Tim dukungan akan memperbarui status tiket menjadi Diproses atau Selesai.',
  },
];

const KATEGORI_OPTIONS: TiketKategori[] = ['Teknis', 'Akun', 'Data', 'Lainnya'];

const STATUS_TONE: Record<TiketStatus, 'warning' | 'info' | 'success'> = {
  Terbuka: 'warning',
  Diproses: 'info',
  Selesai: 'success',
};

export default function BantuanPage() {
  const { tiketBantuan, addTiketBantuan } = useData();
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<TiketKategori>('Teknis');
  const [deskripsi, setDeskripsi] = useState('');
  const [error, setError] = useState('');

  const tiketUrut = [...tiketBantuan].sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada));

  const columns: DataTableColumn<TiketBantuan>[] = [
    { header: 'Judul', cell: (t) => t.judul },
    { header: 'Kategori', cell: (t) => t.kategori },
    { header: 'Status', cell: (t) => <StatusBadge label={t.status} tone={STATUS_TONE[t.status]} /> },
    { header: 'Tanggal Dibuat', cell: (t) => formatDate(t.dibuatPada) },
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

      <Card>
        <CardHeader className="text-sm font-semibold">Pertanyaan yang Sering Diajukan</CardHeader>
        <CardContent>
          <Accordion>
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.pertanyaan} value={String(i)}>
                <AccordionTrigger>{item.pertanyaan}</AccordionTrigger>
                <AccordionContent>{item.jawaban}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

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
              <label className="text-sm text-muted-foreground">Judul</label>
              <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Ringkasan singkat masalah Anda" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Kategori</label>
              <Select
                items={KATEGORI_OPTIONS.map((k) => ({ value: k, label: k }))}
                value={kategori}
                onValueChange={(v) => setKategori((v ?? 'Teknis') as TiketKategori)}
              >
                <SelectTrigger>
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
              <label className="text-sm text-muted-foreground">Deskripsi</label>
              <Textarea
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
  );
}
