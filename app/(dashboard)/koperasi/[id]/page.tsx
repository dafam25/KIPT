'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Nelayan } from '@/lib/types';
import { formatNumber, formatRupiah } from '@/lib/format';
import { peringkatVolume } from '@/lib/stats';
import { AVATAR_DEFAULT } from '@/lib/avatar';

export default function KoperasiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { koperasi, nelayan, kapal } = useData();
  const { t } = useLanguage();

  const item = koperasi.find((k) => k.id === id);

  if (!item) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t('koperasi.notFound')}</p>
        <Button variant="outline" onClick={() => router.push('/koperasi')}>
          {t('koperasi.backToList')}
        </Button>
      </div>
    );
  }

  const anggota = nelayan.filter((n) => n.koperasiId === item.id);
  const peringkat = peringkatVolume(koperasi, item.id);

  const anggotaColumns: DataTableColumn<Nelayan>[] = [
    {
      header: t('koperasi.colNama'),
      cell: (n) => (
        <Link href={`/nelayan/${n.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
          <img
            src={n.fotoUrl || AVATAR_DEFAULT}
            alt={n.nama}
            className="h-6 w-6 shrink-0 rounded-full border border-border object-cover"
          />
          {n.nama}
        </Link>
      ),
    },
    { header: t('koperasi.colKapal'), cell: (n) => kapal.find((k) => k.id === n.kapalId)?.nama ?? '-' },
    {
      header: t('koperasi.colStatus2'),
      cell: (n) => (
        <StatusBadge
          label={n.status === 'aktif' ? t('status.aktif') : t('status.nonaktif')}
          tone={n.status === 'aktif' ? 'success' : 'muted'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: t('koperasi.listTitle'), href: '/koperasi' },
          { label: item.nama },
        ]}
        title={t('koperasi.detailTitle')}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
          {item.nama}
          <StatusBadge label={item.status === 'Aktif' ? t('status.aktif') : t('status.nonaktif')} tone={item.status === 'Aktif' ? 'success' : 'muted'} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
          <div><span className="text-muted-foreground">{t('koperasi.fieldLokasi')}</span><p className="font-medium">{item.lokasi}</p></div>
          <div><span className="text-muted-foreground">{t('koperasi.fieldKetua')}</span><p className="font-medium">{item.ketua}</p></div>
          <div><span className="text-muted-foreground">{t('koperasi.fieldAnggotaTerdaftar')}</span><p className="font-medium">{formatNumber(item.jumlahAnggota)}</p></div>
          <div><span className="text-muted-foreground">{t('koperasi.fieldVolumeHasil')}</span><p className="font-medium">{formatNumber(item.volumeKg)} kg</p></div>
          <div><span className="text-muted-foreground">{t('koperasi.fieldNilaiTransaksi')}</span><p className="font-medium">{formatRupiah(item.nilaiTransaksi)}</p></div>
          <div><span className="text-muted-foreground">{t('koperasi.fieldPeringkatVolume')}</span><p className="font-medium">{t('koperasi.peringkatDariTotal', { peringkat, total: koperasi.length })}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">
          {t('koperasi.anggotaTerhubung', { count: anggota.length })}
          <p className="text-xs font-normal text-muted-foreground">
            {t('koperasi.anggotaSubtitle')}
          </p>
        </CardHeader>
        <CardContent>
          {anggota.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('koperasi.belumAdaNelayan')}</p>
          ) : (
            <DataTable data={anggota} columns={anggotaColumns} getRowKey={(n) => n.id} pageSize={10} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
