'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { NotificationFeed } from '@/components/dashboard/notification-feed';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { NotifikasiJenis } from '@/lib/types';

type Kategori = NotifikasiJenis | 'semua';

const KATEGORI_OPTIONS: { value: Kategori; label: string }[] = [
  { value: 'semua', label: 'Semua Kategori' },
  { value: 'peringatan', label: 'Peringatan' },
  { value: 'informasi', label: 'Informasi' },
  { value: 'sukses', label: 'Sukses' },
  { value: 'sistem', label: 'Sistem' },
];

export default function NotifikasiPage() {
  const [kategori, setKategori] = useState<Kategori>('semua');

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifikasi' }]}
        title="Notifikasi"
        description="Semua notifikasi dan peringatan sistem"
      />
      <div className="max-w-xs">
        <Select items={KATEGORI_OPTIONS} value={kategori} onValueChange={(v) => setKategori((v ?? 'semua') as Kategori)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KATEGORI_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <NotificationFeed filterJenis={kategori} />
    </div>
  );
}
