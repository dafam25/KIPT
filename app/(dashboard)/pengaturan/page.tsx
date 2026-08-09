'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toastManager } from '@/components/ui/toast';

const DECORATIVE_TABS = [
  { value: 'akun', label: 'Akun & Keamanan' },
  { value: 'notifikasi', label: 'Notifikasi' },
  { value: 'integrasi', label: 'Integrasi' },
  { value: 'backup', label: 'Data & Backup' },
  { value: 'pengguna', label: 'Manajemen Pengguna' },
] as const;

const BAHASA_OPTIONS = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' },
];

const ZONA_WAKTU_OPTIONS = [
  { value: 'wib', label: 'WIB (UTC+7)' },
  { value: 'wita', label: 'WITA (UTC+8)' },
  { value: 'wit', label: 'WIT (UTC+9)' },
];

const FORMAT_TANGGAL_OPTIONS = [
  { value: 'dd-mmm-yyyy', label: '10 Mei 2025' },
  { value: 'dd/mm/yyyy', label: '10/05/2025' },
  { value: 'yyyy-mm-dd', label: '2025-05-10' },
];

const SATUAN_BERAT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'ton', label: 'Ton' },
];

function showComingSoonToast() {
  toastManager.add({
    title: 'Fitur belum tersedia',
    description: 'Fitur ini memerlukan sistem akun & backend, tersedia di versi mendatang.',
  });
}

export default function PengaturanPage() {
  const [notifikasiCuaca, setNotifikasiCuaca] = useState(true);
  const [notifikasiKapal, setNotifikasiKapal] = useState(true);
  const [sinkronisasiOtomatis, setSinkronisasiOtomatis] = useState(false);
  const [tampilanKompak, setTampilanKompak] = useState(false);
  const [bahasa, setBahasa] = useState('id');
  const [namaAplikasi, setNamaAplikasi] = useState('Digital Fisherman ID');
  const [zonaWaktu, setZonaWaktu] = useState('wib');
  const [formatTanggal, setFormatTanggal] = useState('dd-mmm-yyyy');
  const [satuanBerat, setSatuanBerat] = useState('kg');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pengaturan' }]}
        title="Pengaturan"
        description="Kelola preferensi dan konfigurasi sistem"
      />
      <Tabs defaultValue="umum">
        <TabsList>
          <TabsTrigger value="umum">Pengaturan Umum</TabsTrigger>
          {DECORATIVE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="preferensi">Preferensi</TabsTrigger>
        </TabsList>

        <TabsContent value="umum" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="text-sm font-semibold">Konfigurasi Aplikasi</CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="cfg-nama-aplikasi" className="text-sm text-muted-foreground">Nama Aplikasi</label>
                <Input id="cfg-nama-aplikasi" value={namaAplikasi} onChange={(e) => setNamaAplikasi(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cfg-zona-waktu" className="text-sm text-muted-foreground">Zona Waktu</label>
                <Select items={ZONA_WAKTU_OPTIONS} value={zonaWaktu} onValueChange={(v) => setZonaWaktu(v ?? 'wib')}>
                  <SelectTrigger id="cfg-zona-waktu"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ZONA_WAKTU_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cfg-format-tanggal" className="text-sm text-muted-foreground">Format Tanggal</label>
                <Select items={FORMAT_TANGGAL_OPTIONS} value={formatTanggal} onValueChange={(v) => setFormatTanggal(v ?? 'dd-mmm-yyyy')}>
                  <SelectTrigger id="cfg-format-tanggal"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAT_TANGGAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cfg-satuan-berat" className="text-sm text-muted-foreground">Satuan Berat</label>
                <Select items={SATUAN_BERAT_OPTIONS} value={satuanBerat} onValueChange={(v) => setSatuanBerat(v ?? 'kg')}>
                  <SelectTrigger id="cfg-satuan-berat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SATUAN_BERAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button variant="outline" onClick={showComingSoonToast}>
                  Simpan Konfigurasi
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-sm font-semibold">Preferensi Notifikasi & Tampilan</CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifikasi Peringatan Cuaca</p>
                  <p className="text-xs text-muted-foreground">Terima notifikasi saat ada peringatan cuaca ekstrem</p>
                </div>
                <Switch checked={notifikasiCuaca} onCheckedChange={setNotifikasiCuaca} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifikasi Kapal Melaut</p>
                  <p className="text-xs text-muted-foreground">Terima notifikasi saat status kapal berubah menjadi melaut</p>
                </div>
                <Switch checked={notifikasiKapal} onCheckedChange={setNotifikasiKapal} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sinkronisasi Data Otomatis</p>
                  <p className="text-xs text-muted-foreground">Perbarui data secara otomatis setiap beberapa menit</p>
                </div>
                <Switch checked={sinkronisasiOtomatis} onCheckedChange={setSinkronisasiOtomatis} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mode Tampilan Kompak</p>
                  <p className="text-xs text-muted-foreground">Kurangi jarak antar elemen pada tabel dan daftar</p>
                </div>
                <Switch checked={tampilanKompak} onCheckedChange={setTampilanKompak} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {DECORATIVE_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-4">
            <Card>
              <CardHeader className="text-sm font-semibold">{tab.label}</CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pengaturan {tab.label.toLowerCase()} akan tersedia setelah sistem akun & backend diimplementasikan.
                </p>
                <Button variant="outline" onClick={showComingSoonToast}>
                  Simpan Perubahan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="preferensi" className="pt-4">
          <Card>
            <CardHeader className="text-sm font-semibold">Preferensi</CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs space-y-1.5">
                <label htmlFor="pengaturan-bahasa" className="text-sm text-muted-foreground">Bahasa</label>
                <Select items={BAHASA_OPTIONS} value={bahasa} onValueChange={(v) => setBahasa(v ?? 'id')}>
                  <SelectTrigger id="pengaturan-bahasa"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BAHASA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={showComingSoonToast}>
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
