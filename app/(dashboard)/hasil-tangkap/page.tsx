'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Fish, Wallet, Ship, Layers } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendLineChart } from '@/components/dashboard/trend-line-chart';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { HasilTangkap, BiosecurityCheck } from '@/lib/types';
import {
  totalHasilTangkapKg, totalNilaiTangkapan, rataRataPerTripKg,
  komposisiHasilTangkap, trenHasilTangkapHarian, rekapPerKapal, rekapPerWilayah,
} from '@/lib/stats';
import { formatNumber, formatRupiah, formatDate } from '@/lib/format';

type RekapRow = { label: string; totalKg: number; jumlahTrip: number };
type JenisRow = { nama: string; beratKg: number; persen: number };

export default function HasilTangkapPage() {
  const { hasilTangkap, kapal, biosecurityCheck } = useData();
  const { t } = useLanguage();

  const komposisi = useMemo(() => komposisiHasilTangkap(hasilTangkap), [hasilTangkap]);
  const tren = useMemo(() => trenHasilTangkapHarian(hasilTangkap), [hasilTangkap]);
  const perKapal = useMemo(() => rekapPerKapal(hasilTangkap, kapal), [hasilTangkap, kapal]);
  const perWilayah = useMemo(() => rekapPerWilayah(hasilTangkap), [hasilTangkap]);
  const terbaru = useMemo(
    () => [...hasilTangkap].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 10),
    [hasilTangkap],
  );
  const terbaruBiosecurity = useMemo(
    () => [...biosecurityCheck].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 10),
    [biosecurityCheck],
  );

  const jenisIkanColumns: DataTableColumn<JenisRow>[] = [
    { header: t('hasilTangkap.colJenisIkan'), cell: (r) => r.nama },
    { header: t('hasilTangkap.colBeratKg'), cell: (r) => formatNumber(r.beratKg) },
    { header: t('hasilTangkap.colPersentase'), cell: (r) => `${r.persen.toFixed(1)}%` },
  ];

  const rekapColumns: DataTableColumn<RekapRow>[] = [
    { header: t('hasilTangkap.colNama'), cell: (r) => r.label },
    { header: t('hasilTangkap.colTotalBeratKg'), cell: (r) => formatNumber(r.totalKg) },
    { header: t('hasilTangkap.colJumlahTrip'), cell: (r) => formatNumber(r.jumlahTrip) },
  ];

  const terbaruColumns: DataTableColumn<HasilTangkap>[] = [
    { header: t('hasilTangkap.colTanggal'), cell: (h) => formatDate(h.tanggal) },
    { header: t('hasilTangkap.colKapal'), cell: (h) => kapal.find((k) => k.id === h.kapalId)?.nama ?? h.kapalId },
    { header: t('hasilTangkap.colLokasi'), cell: (h) => h.lokasi },
    {
      header: t('hasilTangkap.colJenisIkan'),
      cell: (h) => {
        const names = h.jenisIkan.map((j) => j.nama).join(', ');
        return (
          <span className="block max-w-48 truncate" title={names}>
            {names}
          </span>
        );
      },
    },
    { header: t('hasilTangkap.colBeratKg'), cell: (h) => formatNumber(h.jenisIkan.reduce((s, j) => s + j.beratKg, 0)) },
    { header: t('hasilTangkap.colNilai'), cell: (h) => formatRupiah(h.estimasiNilai) },
    {
      header: t('hasilTangkap.colStatus'),
      cell: (h) => (
        <StatusBadge
          label={h.status === 'verified' ? t('status.terverifikasi') : t('status.menunggu')}
          tone={h.status === 'verified' ? 'success' : 'warning'}
        />
      ),
    },
  ];

  const biosecurityColumns: DataTableColumn<BiosecurityCheck>[] = [
    { header: t('hasilTangkap.colTanggal'), cell: (b) => formatDate(b.tanggal) },
    { header: t('hasilTangkap.colKapal'), cell: (b) => kapal.find((k) => k.id === b.kapalId)?.nama ?? b.kapalId },
    { header: t('hasilTangkap.colPetugas'), cell: (b) => b.petugas },
    { header: t('hasilTangkap.colNomorSertifikat'), cell: (b) => b.nomorSertifikat },
    {
      header: t('hasilTangkap.colStatus'),
      cell: (b) => (
        <StatusBadge
          label={b.hasil === 'lolos' ? t('status.lolos') : t('status.tidakLolos')}
          tone={b.hasil === 'lolos' ? 'success' : 'destructive'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('hasilTangkap.title') }]}
        title={t('hasilTangkap.title')}
        description={t('hasilTangkap.description')}
        actions={
          <>
            <Link href="/hasil-tangkap/biosecurity" className={buttonVariants({ variant: 'outline' })}>
              {t('hasilTangkap.cekBiosecurity')}
            </Link>
            <Link href="/hasil-tangkap/input" className={buttonVariants()}>
              {t('hasilTangkap.inputHasilTangkap')}
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Fish} label={t('hasilTangkap.kpiTotalHasilTangkapan')} value={`${formatNumber(totalHasilTangkapKg(hasilTangkap))} kg`} accent="blue" />
        <KpiCard icon={Wallet} label={t('hasilTangkap.kpiTotalNilaiTangkapan')} value={formatRupiah(totalNilaiTangkapan(hasilTangkap))} accent="green" />
        <KpiCard icon={Ship} label={t('hasilTangkap.kpiRataRataPerTrip')} value={`${formatNumber(Math.round(rataRataPerTripKg(hasilTangkap)))} kg`} accent="cyan" />
        <KpiCard icon={Layers} label={t('hasilTangkap.kpiJenisIkanTertangkap')} value={`${formatNumber(komposisi.length)} ${t('hasilTangkap.jenisSuffix')}`} accent="purple" />
      </div>

      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="ringkasan">
            <TabsList>
              <TabsTrigger value="ringkasan">{t('hasilTangkap.tabRingkasan')}</TabsTrigger>
              <TabsTrigger value="jenis-ikan">{t('hasilTangkap.tabPerJenisIkan')}</TabsTrigger>
              <TabsTrigger value="kapal">{t('hasilTangkap.tabPerKapal')}</TabsTrigger>
              <TabsTrigger value="wilayah">{t('hasilTangkap.tabPerWilayah')}</TabsTrigger>
            </TabsList>
            <TabsContent value="ringkasan" className="pt-4">
              <TrendLineChart data={tren} />
            </TabsContent>
            <TabsContent value="jenis-ikan" className="space-y-4 pt-4">
              <DonutChart data={komposisi} />
              <DataTable data={komposisi} columns={jenisIkanColumns} getRowKey={(r) => r.nama} />
            </TabsContent>
            <TabsContent value="kapal" className="pt-4">
              <DataTable data={perKapal} columns={rekapColumns} getRowKey={(r) => r.label} />
            </TabsContent>
            <TabsContent value="wilayah" className="pt-4">
              <DataTable data={perWilayah} columns={rekapColumns} getRowKey={(r) => r.label} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">{t('hasilTangkap.dataTerbaru')}</CardHeader>
        <CardContent>
          <DataTable data={terbaru} columns={terbaruColumns} getRowKey={(h) => h.id} pageSize={10} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">{t('hasilTangkap.statusBiosecurityTerbaru')}</CardHeader>
        <CardContent>
          <DataTable data={terbaruBiosecurity} columns={biosecurityColumns} getRowKey={(b) => b.id} pageSize={10} />
        </CardContent>
      </Card>
    </div>
  );
}
