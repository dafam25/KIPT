'use client';

import Link from 'next/link';
import { Building2, CheckCircle2, Fish, Wallet } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { PasarIndustri } from '@/lib/types';
import { formatNumber, formatRupiah } from '@/lib/format';
import { totalVolumePasarIndustri, totalNilaiPasarIndustri, aktifPasarIndustriCount } from '@/lib/stats';

export default function PasarIndustriListPage() {
  const { pasarIndustri } = useData();
  const { t } = useLanguage();

  const totalVolume = totalVolumePasarIndustri(pasarIndustri);
  const totalNilai = totalNilaiPasarIndustri(pasarIndustri);
  const aktifCount = aktifPasarIndustriCount(pasarIndustri);

  const columns: DataTableColumn<PasarIndustri>[] = [
    {
      header: t('pasarIndustri.colNama'),
      cell: (p) => (
        <Link href={`/pasar-industri/${p.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Building2 className="h-3.5 w-3.5" />
          </span>
          {p.nama}
        </Link>
      ),
    },
    { header: t('pasarIndustri.colJenis'), cell: (p) => p.jenis },
    { header: t('pasarIndustri.colLokasi'), cell: (p) => p.lokasi },
    {
      header: t('pasarIndustri.colPengelola'),
      cell: (p) => (
        <span className="block max-w-40 truncate" title={p.pengelola}>
          {p.pengelola}
        </span>
      ),
    },
    { header: t('pasarIndustri.colVolumeKg'), cell: (p) => formatNumber(p.volumeKg) },
    { header: t('pasarIndustri.colNilaiTransaksi'), cell: (p) => formatRupiah(p.nilaiTransaksi) },
    {
      header: t('pasarIndustri.colStatus'),
      cell: (p) => <StatusBadge label={p.status === 'Aktif' ? t('status.aktif') : t('status.nonaktif')} tone={p.status === 'Aktif' ? 'success' : 'muted'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('pasarIndustri.listTitle') }]}
        title={t('pasarIndustri.listTitle')}
        description={t('pasarIndustri.listDescription')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Building2} label={t('pasarIndustri.kpiTotal')} value={formatNumber(pasarIndustri.length)} deltaPercent={3.2} deltaLabel={t('common.comparedToLastMonth')} accent="blue" />
        <KpiCard icon={CheckCircle2} label={t('pasarIndustri.kpiAktif')} value={formatNumber(aktifCount)} deltaPercent={2.5} deltaLabel={t('common.comparedToLastMonth')} accent="green" />
        <KpiCard icon={Fish} label={t('pasarIndustri.kpiVolumeDistribusi')} value={formatNumber(totalVolume)} deltaPercent={4.8} deltaLabel={t('common.comparedToLastMonth')} accent="cyan" />
        <KpiCard icon={Wallet} label={t('pasarIndustri.kpiNilaiTransaksi')} value={formatRupiah(totalNilai)} deltaPercent={5.9} deltaLabel={t('common.comparedToLastMonth')} accent="purple" />
      </div>
      <DataTable
        data={pasarIndustri}
        columns={columns}
        getRowKey={(p) => p.id}
        searchPlaceholder={t('pasarIndustri.searchPlaceholder')}
        filterFn={(p, q) => p.nama.toLowerCase().includes(q) || p.lokasi.toLowerCase().includes(q)}
      />
    </div>
  );
}
