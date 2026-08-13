'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Ship, Anchor, PauseCircle, AlertTriangle, ExternalLink, Fish, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
import { totalKapal, kapalMelautCount, kapalSandarCount, kapalTidakAktifCount } from '@/lib/stats';
import { formatNumber, formatDate } from '@/lib/format';
import { KAPAL_STATUS_LABEL_KEY, KAPAL_STATUS_TONE } from '@/lib/kapal-status';
import { paginate, totalPages, pageNumbersToShow } from '@/lib/table';

const MapView = dynamic(
  () => import('@/components/dashboard/map-view').then((mod) => mod.MapView),
  { ssr: false }
);

export default function PetaTrackingPage() {
  const { kapal, hasilTangkap } = useData();
  const { t } = useLanguage();

  const [statusFilter, setStatusFilter] = useState('semua');
  const [jenisFilter, setJenisFilter] = useState('semua');
  const [page, setPage] = useState(1);
  const VESSEL_PAGE_SIZE = 10;

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

  const aktivitasTerbaru = useMemo(
    () =>
      [...hasilTangkap]
        .sort((a, b) => `${b.tanggal}${b.waktuSelesai}`.localeCompare(`${a.tanggal}${a.waktuSelesai}`))
        .slice(0, 5)
        .map((h) => ({
          id: h.id,
          kapalNama: kapal.find((k) => k.id === h.kapalId)?.nama ?? h.kapalId,
          beratKg: h.jenisIkan.reduce((sum, j) => sum + j.beratKg, 0),
          lokasi: h.lokasi,
          tanggal: h.tanggal,
        })),
    [hasilTangkap, kapal],
  );

  const [search, setSearch] = useState('');
  const searchedKapal = filteredKapal.filter((k) => k.nama.toLowerCase().includes(search.toLowerCase()));

  const vesselPageCount = totalPages(searchedKapal.length, VESSEL_PAGE_SIZE);
  const vesselPageSafe = Math.min(page, vesselPageCount);
  const pagedKapal = paginate(searchedKapal, vesselPageSafe, VESSEL_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('petaTracking.title') }]}
        title={t('petaTracking.title')}
        description={t('petaTracking.description')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Ship} label={t('petaTracking.kpiTotalKapalAktif')} value={formatNumber(totalKapal(kapal))} accent="blue" />
        <KpiCard icon={Anchor} label={t('petaTracking.kpiKapalMelaut')} value={formatNumber(kapalMelautCount(kapal))} accent="green" />
        <KpiCard icon={PauseCircle} label={t('petaTracking.kpiKapalSandar')} value={formatNumber(kapalSandarCount(kapal))} accent="cyan" />
        <KpiCard icon={AlertTriangle} label={t('petaTracking.kpiKapalTidakAktif')} value={formatNumber(kapalTidakAktifCount(kapal))} accent="purple" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select
            items={[{ value: 'semua', label: t('petaTracking.semuaStatus') }, ...Object.entries(KAPAL_STATUS_LABEL_KEY).map(([value, key]) => ({ value, label: t(key) }))]}
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v ?? 'semua');
              setPage(1);
            }}
          >
            <SelectTrigger aria-label={t('petaTracking.filterStatusAria')}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">{t('petaTracking.semuaStatus')}</SelectItem>
              {Object.entries(KAPAL_STATUS_LABEL_KEY).map(([value, key]) => (
                <SelectItem key={value} value={value}>{t(key)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select
            items={[{ value: 'semua', label: t('petaTracking.semuaJenisKapal') }, ...jenisOptions.map((j) => ({ value: j, label: j }))]}
            value={jenisFilter}
            onValueChange={(v) => {
              setJenisFilter(v ?? 'semua');
              setPage(1);
            }}
          >
            <SelectTrigger aria-label={t('petaTracking.filterJenisAria')}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">{t('petaTracking.semuaJenisKapal')}</SelectItem>
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
            {t('petaTracking.detailKapalTerpilih')}
            <button
              type="button"
              onClick={() => setSelectedKapalId(null)}
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              {t('petaTracking.tutup')}
            </button>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-base font-semibold">{selectedKapal.nama}</p>
              <p className="text-sm text-muted-foreground">{selectedKapal.jenis} &middot; {selectedKapal.gt} GT</p>
            </div>
            <StatusBadge label={t(KAPAL_STATUS_LABEL_KEY[selectedKapal.status])} tone={KAPAL_STATUS_TONE[selectedKapal.status]} />
            <div className="text-sm text-muted-foreground">
              {t('petaTracking.pelabuhanInduk')} <span className="text-foreground">{selectedKapal.pelabuhanInduk}</span>
            </div>
            {selectedKapal.status === 'melaut' && (
              <div className="text-sm text-muted-foreground">
                {t('petaTracking.kecepatan')} <span className="text-foreground">{selectedKapal.kecepatanKnot} knot</span>
              </div>
            )}
            <Button size="sm" render={<Link href={`/kapal/${selectedKapal.id}`} />} className="ml-auto">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('petaTracking.lihatDetailKapal')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="text-sm font-semibold">{t('petaTracking.daftarKapalTerpantau')}</CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('petaTracking.searchPlaceholder')}
            className="max-w-sm"
          />
          <div className="divide-y divide-border">
            {pagedKapal.map((k) => (
              <div
                key={k.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedKapalId(k.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedKapalId(k.id);
                  }
                }}
                className="flex cursor-pointer items-center gap-3 py-3 hover:bg-muted/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Ship className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{k.nama}</p>
                  <p className="text-xs text-muted-foreground">{k.jenis}</p>
                </div>
                <StatusBadge label={t(KAPAL_STATUS_LABEL_KEY[k.status])} tone={KAPAL_STATUS_TONE[k.status]} />
                <span className="w-16 shrink-0 text-right text-sm text-muted-foreground">
                  {k.status === 'melaut' ? `${k.kecepatanKnot} knot` : '—'}
                </span>
              </div>
            ))}
            {searchedKapal.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('petaTracking.tidakAdaKapalCocok')}</p>
            )}
          </div>
          {vesselPageCount > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('petaTracking.showingVessels', {
                  from: (vesselPageSafe - 1) * VESSEL_PAGE_SIZE + 1,
                  to: Math.min(vesselPageSafe * VESSEL_PAGE_SIZE, searchedKapal.length),
                  total: searchedKapal.length,
                })}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={vesselPageSafe <= 1}
                  onClick={() => setPage(vesselPageSafe - 1)}
                  aria-label={t('common.previousPage')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {pageNumbersToShow(vesselPageSafe, vesselPageCount).map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1.5">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === vesselPageSafe ? 'default' : 'outline'}
                      size="icon-sm"
                      onClick={() => setPage(p)}
                      aria-current={p === vesselPageSafe ? 'page' : undefined}
                    >
                      {p}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={vesselPageSafe >= vesselPageCount}
                  onClick={() => setPage(vesselPageSafe + 1)}
                  aria-label={t('common.nextPage')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">{t('petaTracking.aktivitasTerbaru')}</CardHeader>
        <CardContent className="space-y-3">
          {aktivitasTerbaru.map((a) => (
            <div key={a.id} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Fish className="h-3.5 w-3.5" />
              </span>
              <div>
                <p>
                  <span className="font-medium">{a.kapalNama}</span>{' '}
                  {t('petaTracking.mendapatkanHasil', { berat: formatNumber(a.beratKg), lokasi: a.lokasi })}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(a.tanggal)}</p>
              </div>
            </div>
          ))}
          {aktivitasTerbaru.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('petaTracking.belumAdaAktivitas')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
