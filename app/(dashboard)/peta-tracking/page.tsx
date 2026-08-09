'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Ship, Anchor, PauseCircle, AlertTriangle } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
import type { Kapal } from '@/lib/types';
import { totalKapal, kapalMelautCount, kapalSandarCount, kapalTidakAktifCount } from '@/lib/stats';
import { formatNumber } from '@/lib/format';
import { KAPAL_STATUS_LABEL, KAPAL_STATUS_TONE } from '@/lib/kapal-status';

const MapView = dynamic(
  () => import('@/components/dashboard/map-view').then((mod) => mod.MapView),
  { ssr: false }
);

export default function PetaTrackingPage() {
  const { kapal } = useData();

  const [statusFilter, setStatusFilter] = useState('semua');
  const [jenisFilter, setJenisFilter] = useState('semua');

  const jenisOptions = useMemo(() => [...new Set(kapal.map((k) => k.jenis))].sort(), [kapal]);

  const filteredKapal = useMemo(
    () =>
      kapal.filter(
        (k) =>
          (statusFilter === 'semua' || k.status === statusFilter) &&
          (jenisFilter === 'semua' || k.jenis === jenisFilter),
      ),
    [kapal, statusFilter, jenisFilter],
  );

  const columns: DataTableColumn<Kapal>[] = [
    { header: 'Nama Kapal', cell: (k) => k.nama },
    { header: 'Jenis', cell: (k) => k.jenis },
    { header: 'Status', cell: (k) => <StatusBadge label={KAPAL_STATUS_LABEL[k.status]} tone={KAPAL_STATUS_TONE[k.status]} /> },
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select
            items={[{ value: 'semua', label: 'Semua Status' }, ...Object.entries(KAPAL_STATUS_LABEL).map(([value, label]) => ({ value, label }))]}
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? 'semua')}
          >
            <SelectTrigger aria-label="Filter status kapal"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              {Object.entries(KAPAL_STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select
            items={[{ value: 'semua', label: 'Semua Jenis Kapal' }, ...jenisOptions.map((j) => ({ value: j, label: j }))]}
            value={jenisFilter}
            onValueChange={(v) => setJenisFilter(v ?? 'semua')}
          >
            <SelectTrigger aria-label="Filter jenis kapal"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Jenis Kapal</SelectItem>
              {jenisOptions.map((j) => (
                <SelectItem key={j} value={j}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <MapView kapal={filteredKapal} height={480} />
        </div>
        <WeatherWidget />
      </div>

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
