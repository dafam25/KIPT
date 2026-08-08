'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toastManager } from '@/components/ui/toast';

const DECORATIVE_TABS = [
  { value: 'akun', label: 'Akun & Keamanan' },
  { value: 'notifikasi', label: 'Notifikasi' },
  { value: 'integrasi', label: 'Integrasi' },
  { value: 'backup', label: 'Data & Backup' },
  { value: 'preferensi', label: 'Preferensi' },
] as const;

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

  return (
    <div className="space-y-6">
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
        </TabsList>

        <TabsContent value="umum" className="pt-4">
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
      </Tabs>
    </div>
  );
}
