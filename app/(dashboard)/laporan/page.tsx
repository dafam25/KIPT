'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Fish, Wallet, Ship, Layers, UsersRound, CheckCircle2, Building2, Download } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendLineChart } from '@/components/dashboard/trend-line-chart';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { TopRankingBarChart } from '@/components/dashboard/top-ranking-bar-chart';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Koperasi, PasarIndustri } from '@/lib/types';
import {
  totalHasilTangkapKg, totalNilaiTangkapan, rataRataPerTripKg, komposisiHasilTangkap, trenHasilTangkapHarian,
  totalVolumeKoperasi, totalNilaiKoperasi, aktifKoperasiCount, komposisiVolumeKoperasi,
  totalVolumePasarIndustri, totalNilaiPasarIndustri, aktifPasarIndustriCount, komposisiVolumePasarIndustri,
  peringkatVolume, rekapPerWilayah,
} from '@/lib/stats';
import { formatNumber, formatRupiah } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';

type JenisRow = { nama: string; beratKg: number; persen: number };

type TabValue = 'hasil-tangkap' | 'koperasi' | 'pasar-industri';

export default function LaporanPage() {
  const { hasilTangkap, koperasi, pasarIndustri } = useData();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabValue>('hasil-tangkap');
  const [tanggalDari, setTanggalDari] = useState('');
  const [tanggalSampai, setTanggalSampai] = useState('');

  const hasilTangkapTerfilter = useMemo(
    () =>
      hasilTangkap.filter(
        (h) => (!tanggalDari || h.tanggal >= tanggalDari) && (!tanggalSampai || h.tanggal <= tanggalSampai),
      ),
    [hasilTangkap, tanggalDari, tanggalSampai],
  );

  const komposisiIkan = useMemo(() => komposisiHasilTangkap(hasilTangkapTerfilter), [hasilTangkapTerfilter]);
  const trenIkan = useMemo(() => trenHasilTangkapHarian(hasilTangkapTerfilter), [hasilTangkapTerfilter]);
  const wilayahRanking = useMemo(() => rekapPerWilayah(hasilTangkapTerfilter), [hasilTangkapTerfilter]);
  const komposisiKoperasi = useMemo(() => komposisiVolumeKoperasi(koperasi), [koperasi]);
  const koperasiUrut = useMemo(() => [...koperasi].sort((a, b) => b.volumeKg - a.volumeKg), [koperasi]);
  const komposisiPasar = useMemo(() => komposisiVolumePasarIndustri(pasarIndustri), [pasarIndustri]);
  const pasarUrut = useMemo(() => [...pasarIndustri].sort((a, b) => b.volumeKg - a.volumeKg), [pasarIndustri]);

  const jenisIkanColumns: DataTableColumn<JenisRow>[] = [
    { header: t('laporan.colJenisIkan'), cell: (r) => r.nama },
    { header: t('laporan.colBeratKg'), cell: (r) => formatNumber(r.beratKg) },
    { header: t('laporan.colPersentase'), cell: (r) => `${r.persen.toFixed(1)}%` },
  ];

  const koperasiColumns: DataTableColumn<Koperasi>[] = [
    { header: t('laporan.colPeringkat'), cell: (k) => `#${peringkatVolume(koperasi, k.id)}` },
    {
      header: t('laporan.colNama'),
      cell: (k) => (
        <Link href={`/koperasi/${k.id}`} className="font-medium text-primary hover:underline">
          {k.nama}
        </Link>
      ),
    },
    { header: t('laporan.colLokasi'), cell: (k) => k.lokasi },
    { header: t('laporan.colVolumeKg'), cell: (k) => formatNumber(k.volumeKg) },
    { header: t('laporan.colNilaiTransaksi'), cell: (k) => formatRupiah(k.nilaiTransaksi) },
    {
      header: t('laporan.colStatus'),
      cell: (k) => <StatusBadge label={k.status === 'Aktif' ? t('status.aktif') : t('status.nonaktif')} tone={k.status === 'Aktif' ? 'success' : 'muted'} />,
    },
  ];

  const pasarColumns: DataTableColumn<PasarIndustri>[] = [
    { header: t('laporan.colPeringkat'), cell: (p) => `#${peringkatVolume(pasarIndustri, p.id)}` },
    {
      header: t('laporan.colNama'),
      cell: (p) => (
        <Link href={`/pasar-industri/${p.id}`} className="font-medium text-primary hover:underline">
          {p.nama}
        </Link>
      ),
    },
    { header: t('laporan.colJenis'), cell: (p) => p.jenis },
    { header: t('laporan.colLokasi'), cell: (p) => p.lokasi },
    { header: t('laporan.colVolumeKg'), cell: (p) => formatNumber(p.volumeKg) },
    { header: t('laporan.colNilaiTransaksi'), cell: (p) => formatRupiah(p.nilaiTransaksi) },
    {
      header: t('laporan.colStatus'),
      cell: (p) => <StatusBadge label={p.status === 'Aktif' ? t('status.aktif') : t('status.nonaktif')} tone={p.status === 'Aktif' ? 'success' : 'muted'} />,
    },
  ];

  function handleExport() {
    if (activeTab === 'hasil-tangkap') {
      downloadCsv(
        'laporan-hasil-tangkap.csv',
        ['Jenis Ikan', 'Berat (kg)', 'Persentase'],
        komposisiIkan.map((r) => [r.nama, r.beratKg, `${r.persen.toFixed(1)}%`]),
      );
    } else if (activeTab === 'koperasi') {
      downloadCsv(
        'laporan-koperasi.csv',
        ['Nama', 'Lokasi', 'Volume (kg)', 'Nilai Transaksi', 'Status'],
        koperasiUrut.map((k) => [k.nama, k.lokasi, k.volumeKg, k.nilaiTransaksi, k.status]),
      );
    } else {
      downloadCsv(
        'laporan-pasar-industri.csv',
        ['Nama', 'Jenis', 'Lokasi', 'Volume (kg)', 'Nilai Transaksi', 'Status'],
        pasarUrut.map((p) => [p.nama, p.jenis, p.lokasi, p.volumeKg, p.nilaiTransaksi, p.status]),
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('laporan.title') }]}
        title={t('laporan.title')}
        description={t('laporan.description')}
        actions={
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('laporan.exportLaporan')}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab((v as TabValue) ?? 'hasil-tangkap')}>
        <TabsList>
          <TabsTrigger value="hasil-tangkap">{t('laporan.tabHasilTangkap')}</TabsTrigger>
          <TabsTrigger value="koperasi">{t('laporan.tabKoperasi')}</TabsTrigger>
          <TabsTrigger value="pasar-industri">{t('laporan.tabPasarIndustri')}</TabsTrigger>
        </TabsList>

        <TabsContent value="hasil-tangkap" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor="laporan-dari" className="text-sm text-muted-foreground">{t('laporan.dariTanggal')}</label>
              <Input id="laporan-dari" type="date" value={tanggalDari} onChange={(e) => setTanggalDari(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="laporan-sampai" className="text-sm text-muted-foreground">{t('laporan.sampaiTanggal')}</label>
              <Input id="laporan-sampai" type="date" value={tanggalSampai} onChange={(e) => setTanggalSampai(e.target.value)} />
            </div>
            {(tanggalDari || tanggalSampai) && (
              <Button variant="outline" size="sm" onClick={() => { setTanggalDari(''); setTanggalSampai(''); }}>
                {t('laporan.reset')}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Fish} label={t('laporan.kpiTotalHasilTangkapan')} value={`${formatNumber(totalHasilTangkapKg(hasilTangkapTerfilter))} kg`} accent="blue" />
            <KpiCard icon={Wallet} label={t('laporan.kpiTotalNilaiTangkapan')} value={formatRupiah(totalNilaiTangkapan(hasilTangkapTerfilter))} accent="green" />
            <KpiCard icon={Ship} label={t('laporan.kpiRataRataPerTrip')} value={`${formatNumber(Math.round(rataRataPerTripKg(hasilTangkapTerfilter)))} kg`} accent="cyan" />
            <KpiCard icon={Layers} label={t('laporan.kpiJenisIkanTertangkap')} value={`${formatNumber(komposisiIkan.length)} ${t('laporan.jenisSuffix')}`} accent="purple" />
          </div>
          <Card>
            <CardHeader className="text-sm font-semibold">{t('laporan.trenHasilTangkapanHarian')}</CardHeader>
            <CardContent>
              <TrendLineChart data={trenIkan} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-sm font-semibold">{t('laporan.komposisiPerJenisIkan')}</CardHeader>
            <CardContent className="space-y-4">
              <DonutChart data={komposisiIkan} />
              <DataTable data={komposisiIkan} columns={jenisIkanColumns} getRowKey={(r) => r.nama} />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="text-sm font-semibold">{t('laporan.top5JenisIkan')}</CardHeader>
              <CardContent>
                <TopRankingBarChart
                  data={komposisiIkan.slice(0, 5).map((r) => ({ label: r.nama, value: r.beratKg }))}
                  unit="kg"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-sm font-semibold">{t('laporan.top5WilayahDistribusi')}</CardHeader>
              <CardContent>
                <TopRankingBarChart
                  data={wilayahRanking.slice(0, 5).map((r) => ({ label: r.label, value: r.totalKg }))}
                  unit="kg"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="koperasi" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={UsersRound} label={t('laporan.kpiTotalKoperasi')} value={formatNumber(koperasi.length)} accent="blue" />
            <KpiCard icon={CheckCircle2} label={t('laporan.kpiKoperasiAktif')} value={formatNumber(aktifKoperasiCount(koperasi))} accent="green" />
            <KpiCard icon={Fish} label={t('laporan.kpiTotalVolumeKg')} value={formatNumber(totalVolumeKoperasi(koperasi))} accent="cyan" />
            <KpiCard icon={Wallet} label={t('laporan.kpiTotalNilaiTransaksi')} value={formatRupiah(totalNilaiKoperasi(koperasi))} accent="purple" />
          </div>
          <Card>
            <CardHeader className="text-sm font-semibold">{t('laporan.komposisiVolumePerKoperasi')}</CardHeader>
            <CardContent className="space-y-4">
              <DonutChart data={komposisiKoperasi} />
              <DataTable data={koperasiUrut} columns={koperasiColumns} getRowKey={(k) => k.id} pageSize={10} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pasar-industri" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Building2} label={t('laporan.kpiTotalPasarIndustri')} value={formatNumber(pasarIndustri.length)} accent="blue" />
            <KpiCard icon={CheckCircle2} label={t('laporan.kpiAktif')} value={formatNumber(aktifPasarIndustriCount(pasarIndustri))} accent="green" />
            <KpiCard icon={Fish} label={t('laporan.kpiTotalVolumeKg')} value={formatNumber(totalVolumePasarIndustri(pasarIndustri))} accent="cyan" />
            <KpiCard icon={Wallet} label={t('laporan.kpiTotalNilaiTransaksi')} value={formatRupiah(totalNilaiPasarIndustri(pasarIndustri))} accent="purple" />
          </div>
          <Card>
            <CardHeader className="text-sm font-semibold">{t('laporan.komposisiVolumePerPasarIndustri')}</CardHeader>
            <CardContent className="space-y-4">
              <DonutChart data={komposisiPasar} />
              <DataTable data={pasarUrut} columns={pasarColumns} getRowKey={(p) => p.id} pageSize={10} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
