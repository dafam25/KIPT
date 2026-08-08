'use client';

import dynamic from 'next/dynamic';
import { Ship, Anchor, PauseCircle, AlertTriangle } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Kapal, KapalStatus } from '@/lib/types';
import { totalKapal, kapalMelautCount, kapalSandarCount, kapalTidakAktifCount } from '@/lib/stats';
import { formatNumber } from '@/lib/format';

const MapView = dynamic(
  () => import('@/components/dashboard/map-view').then((mod) => mod.MapView),
  { ssr: false }
);

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

export default function PetaTrackingPage() {
  const { kapal } = useData();

  const columns: DataTableColumn<Kapal>[] = [
    { header: 'Nama Kapal', cell: (k) => k.nama },
    { header: 'Jenis', cell: (k) => k.jenis },
    { header: 'Status', cell: (k) => <StatusBadge label={STATUS_LABEL[k.status]} tone={STATUS_TONE[k.status]} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Peta Tracking' }]}
        title="Peta Tracking"
        description="Pantau pergerakan kapal secara real-time"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Ship} label="Total Kapal Aktif" value={formatNumber(totalKapal(kapal))} accent="blue" />
        <KpiCard icon={Anchor} label="Kapal Melaut" value={formatNumber(kapalMelautCount(kapal))} accent="green" />
        <KpiCard icon={PauseCircle} label="Kapal Sandar" value={formatNumber(kapalSandarCount(kapal))} accent="cyan" />
        <KpiCard icon={AlertTriangle} label="Kapal Tidak Aktif" value={formatNumber(kapalTidakAktifCount(kapal))} accent="purple" />
      </div>

      <MapView kapal={kapal} height={480} />

      <Card>
        <CardHeader className="text-sm font-semibold">Daftar Kapal Terpantau</CardHeader>
        <CardContent>
          <DataTable
            data={kapal}
            columns={columns}
            getRowKey={(k) => k.id}
            searchPlaceholder="Cari nama kapal..."
            filterFn={(k, q) => k.nama.toLowerCase().includes(q)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
