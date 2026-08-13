'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { NotificationFeed } from '@/components/dashboard/notification-feed';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n/context';
import type { NotifikasiJenis } from '@/lib/types';

type Kategori = NotifikasiJenis | 'semua';

export default function NotifikasiPage() {
  const { t } = useLanguage();
  const [kategori, setKategori] = useState<Kategori>('semua');

  const KATEGORI_OPTIONS: { value: Kategori; label: string }[] = [
    { value: 'semua', label: t('notifikasi.semuaKategori') },
    { value: 'peringatan', label: t('notifikasi.peringatan') },
    { value: 'informasi', label: t('notifikasi.informasi') },
    { value: 'sukses', label: t('notifikasi.sukses') },
    { value: 'sistem', label: t('notifikasi.sistem') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('notifikasi.title') }]}
        title={t('notifikasi.title')}
        description={t('notifikasi.description')}
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
