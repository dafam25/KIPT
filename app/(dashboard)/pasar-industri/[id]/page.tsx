'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber, formatRupiah } from '@/lib/format';
import { peringkatVolume } from '@/lib/stats';
import type { PasarIndustri } from '@/lib/types';

const ILUSTRASI_JENIS: Record<PasarIndustri['jenis'], string> = {
  'Pasar Tradisional': '/images/pasar-industri/pasar-tradisional.svg',
  'Pasar Modern': '/images/pasar-industri/pasar-modern.svg',
  'Industri Pengolahan': '/images/pasar-industri/industri-pengolahan.svg',
};

export default function PasarIndustriDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { pasarIndustri } = useData();
  const { t } = useLanguage();

  const item = pasarIndustri.find((p) => p.id === id);

  if (!item) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t('pasarIndustri.notFound')}</p>
        <Button variant="outline" onClick={() => router.push('/pasar-industri')}>
          {t('pasarIndustri.backToList')}
        </Button>
      </div>
    );
  }

  const peringkat = peringkatVolume(pasarIndustri, item.id);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: t('pasarIndustri.listTitle'), href: '/pasar-industri' },
          { label: item.nama },
        ]}
        title={t('pasarIndustri.detailTitle')}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
          {item.nama}
          <StatusBadge label={item.status === 'Aktif' ? t('status.aktif') : t('status.nonaktif')} tone={item.status === 'Aktif' ? 'success' : 'muted'} />
        </CardHeader>
        <img
          src={ILUSTRASI_JENIS[item.jenis]}
          alt={t('pasarIndustri.ilustrasiAlt', { jenis: item.jenis, nama: item.nama })}
          className="h-48 w-full border-y border-border object-cover"
        />
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
          <div><span className="text-muted-foreground">{t('pasarIndustri.fieldJenis')}</span><p className="font-medium">{item.jenis}</p></div>
          <div><span className="text-muted-foreground">{t('pasarIndustri.fieldLokasi')}</span><p className="font-medium">{item.lokasi}</p></div>
          <div><span className="text-muted-foreground">{t('pasarIndustri.fieldPengelola')}</span><p className="font-medium">{item.pengelola}</p></div>
          <div><span className="text-muted-foreground">{t('pasarIndustri.fieldVolumeDistribusi')}</span><p className="font-medium">{formatNumber(item.volumeKg)} kg</p></div>
          <div><span className="text-muted-foreground">{t('pasarIndustri.fieldNilaiTransaksi')}</span><p className="font-medium">{formatRupiah(item.nilaiTransaksi)}</p></div>
          <div><span className="text-muted-foreground">{t('pasarIndustri.fieldPeringkatVolume')}</span><p className="font-medium">{t('pasarIndustri.peringkatDariTotal', { peringkat, total: pasarIndustri.length })}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
