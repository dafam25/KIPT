'use client';

import Link from 'next/link';
import { Ship, Anchor, PauseCircle, AlertTriangle } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { Kapal, KapalStatus } from '@/lib/types';
import { totalKapal, kapalMelautCount, kapalSandarCount, kapalTidakAktifCount } from '@/lib/stats';
import { formatNumber } from '@/lib/format';

const STATUS_LABEL: Record<KapalStatus, string> = {
  melaut: 'Aktif Melaut',
  sandar: 'Sandar',
  tidak_aktif: 'Tidak Aktif',
  perbaikan: 'Perbaikan',
};

const STATUS_TONE: Record<KapalStatus, 'success' | 'warning' | 'destructive' | 'muted'> = {
  melaut: 'success',
  sandar: 'warning',
  tidak_aktif: 'destructive',
  perbaikan: 'muted',
};

export default function KapalListPage() {
  const { kapal, nelayan } = useData();

  const columns: DataTableColumn<Kapal>[] = [
    {
      header: 'Nama Kapal',
      cell: (k) => (
        <Link href={`/kapal/${k.id}`} className="font-medium text-primary hover:underline">
          {k.nama}
        </Link>
      ),
    },
    { header: 'ID Kapal', cell: (k) => <span className="font-mono text-xs">{k.id}</span> },
    { header: 'Jenis', cell: (k) => k.jenis },
    { header: 'GT', cell: (k) => `${k.gt} GT` },
    { header: 'Pelabuhan Induk', cell: (k) => k.pelabuhanInduk },
    { header: 'Nahkoda', cell: (k) => nelayan.find((n) => n.id === k.nahkodaId)?.nama ?? '-' },
    { header: 'Status', cell: (k) => <StatusBadge label={STATUS_LABEL[k.status]} tone={STATUS_TONE[k.status]} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Kapal' }]}
        title="Kapal"
        description="Kelola data kapal terdaftar"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Ship} label="Total Kapal" value={formatNumber(totalKapal(kapal))} accent="blue" />
        <KpiCard icon={Anchor} label="Aktif Melaut" value={formatNumber(kapalMelautCount(kapal))} accent="green" />
        <KpiCard icon={PauseCircle} label="Sandar" value={formatNumber(kapalSandarCount(kapal))} accent="cyan" />
        <KpiCard icon={AlertTriangle} label="Tidak Aktif" value={formatNumber(kapalTidakAktifCount(kapal))} accent="purple" />
      </div>
      <DataTable
        data={kapal}
        columns={columns}
        getRowKey={(k) => k.id}
        searchPlaceholder="Cari nama atau ID kapal..."
        filterFn={(k, q) => k.nama.toLowerCase().includes(q) || k.id.toLowerCase().includes(q)}
      />
    </div>
  );
}
