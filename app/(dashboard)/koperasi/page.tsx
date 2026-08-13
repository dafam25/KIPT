'use client';

import Link from 'next/link';
import { UsersRound, CheckCircle2, Users, Fish } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { Koperasi } from '@/lib/types';
import { formatNumber, formatRupiah } from '@/lib/format';
import { totalVolumeKoperasi, aktifKoperasiCount } from '@/lib/stats';

export default function KoperasiListPage() {
  const { koperasi } = useData();
  const { t } = useLanguage();

  const totalAnggota = koperasi.reduce((sum, k) => sum + k.jumlahAnggota, 0);
  const totalVolume = totalVolumeKoperasi(koperasi);
  const aktifCount = aktifKoperasiCount(koperasi);

  const columns: DataTableColumn<Koperasi>[] = [
    {
      header: t('koperasi.colNamaKoperasi'),
      cell: (k) => (
        <Link href={`/koperasi/${k.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UsersRound className="h-3.5 w-3.5" />
          </span>
          {k.nama}
        </Link>
      ),
    },
    { header: t('koperasi.colLokasi'), cell: (k) => k.lokasi },
    {
      header: t('koperasi.colKetua'),
      cell: (k) => (
        <span className="block max-w-40 truncate" title={k.ketua}>
          {k.ketua}
        </span>
      ),
    },
    { header: t('koperasi.colAnggota'), cell: (k) => formatNumber(k.jumlahAnggota) },
    { header: t('koperasi.colVolumeKg'), cell: (k) => formatNumber(k.volumeKg) },
    { header: t('koperasi.colNilaiTransaksi'), cell: (k) => formatRupiah(k.nilaiTransaksi) },
    {
      header: t('koperasi.colStatus'),
      cell: (k) => (
        <StatusBadge label={k.status === 'Aktif' ? t('status.aktif') : t('status.nonaktif')} tone={k.status === 'Aktif' ? 'success' : 'muted'} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('koperasi.listTitle') }]}
        title={t('koperasi.listTitle')}
        description={t('koperasi.listDescription')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={UsersRound} label={t('koperasi.kpiTotalKoperasi')} value={formatNumber(koperasi.length)} deltaPercent={2.4} deltaLabel={t('common.comparedToLastMonth')} accent="blue" />
        <KpiCard icon={CheckCircle2} label={t('koperasi.kpiKoperasiAktif')} value={formatNumber(aktifCount)} deltaPercent={1.9} deltaLabel={t('common.comparedToLastMonth')} accent="green" />
        <KpiCard icon={Users} label={t('koperasi.kpiAnggotaTerdaftar')} value={formatNumber(totalAnggota)} deltaPercent={3.1} deltaLabel={t('common.comparedToLastMonth')} accent="cyan" />
        <KpiCard icon={Fish} label={t('koperasi.kpiVolumeHasil')} value={formatNumber(totalVolume)} deltaPercent={6.7} deltaLabel={t('common.comparedToLastMonth')} accent="purple" />
      </div>
      <DataTable
        data={koperasi}
        columns={columns}
        getRowKey={(k) => k.id}
        searchPlaceholder={t('koperasi.searchPlaceholder')}
        filterFn={(k, q) => k.nama.toLowerCase().includes(q) || k.lokasi.toLowerCase().includes(q)}
      />
    </div>
  );
}
