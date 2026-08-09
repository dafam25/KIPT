'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Ship, Anchor, PauseCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
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

  const [selectedKapalId, setSelectedKapalId] = useState<string | null>(null);
  const selectedKapal = kapal.find((k) => k.id === selectedKapalId) ?? null;

  const [search, setSearch] = useState('');
  const searchedKapal = filteredKapal.filter((k) => k.nama.toLowerCase().includes(search.toLowerCase()));

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
          <MapView kapal={filteredKapal} height={480} onSelectKapal={setSelectedKapalId} />
        </div>
        <WeatherWidget />
      </div>

      {selectedKapal && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
            Detail Kapal Terpilih
            <button
              type="button"
              onClick={() => setSelectedKapalId(null)}
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              Tutup
            </button>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-base font-semibold">{selectedKapal.nama}</p>
              <p className="text-sm text-muted-foreground">{selectedKapal.jenis} &middot; {selectedKapal.gt} GT</p>
            </div>
            <StatusBadge label={KAPAL_STATUS_LABEL[selectedKapal.status]} tone={KAPAL_STATUS_TONE[selectedKapal.status]} />
            <div className="text-sm text-muted-foreground">
              Pelabuhan Induk: <span className="text-foreground">{selectedKapal.pelabuhanInduk}</span>
            </div>
            {selectedKapal.status === 'melaut' && (
              <div className="text-sm text-muted-foreground">
                Kecepatan: <span className="text-foreground">{selectedKapal.kecepatanKnot} knot</span>
              </div>
            )}
            <Button size="sm" render={<Link href={`/kapal/${selectedKapal.id}`} />} className="ml-auto">
              <ExternalLink className="mr-2 h-4 w-4" />
              Lihat Detail Kapal
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="text-sm font-semibold">Daftar Kapal Terpantau</CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kapal..."
            className="max-w-sm"
          />
          <div className="divide-y divide-border">
            {searchedKapal.map((k) => (
              <div
                key={k.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedKapalId(k.id)}
                className="flex cursor-pointer items-center gap-3 py-3 hover:bg-muted/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Ship className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{k.nama}</p>
                  <p className="text-xs text-muted-foreground">{k.jenis}</p>
                </div>
                <StatusBadge label={KAPAL_STATUS_LABEL[k.status]} tone={KAPAL_STATUS_TONE[k.status]} />
                <span className="w-16 shrink-0 text-right text-sm text-muted-foreground">
                  {k.status === 'melaut' ? `${k.kecepatanKnot} knot` : '—'}
                </span>
              </div>
            ))}
            {searchedKapal.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada kapal yang cocok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
