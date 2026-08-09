'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Fish, Wallet, Ship, Layers } from 'lucide-react';
import { useData } from '@/context/data-context';
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
    { header: 'Jenis Ikan', cell: (r) => r.nama },
    { header: 'Berat (kg)', cell: (r) => formatNumber(r.beratKg) },
    { header: 'Persentase', cell: (r) => `${r.persen.toFixed(1)}%` },
  ];

  const rekapColumns: DataTableColumn<RekapRow>[] = [
    { header: 'Nama', cell: (r) => r.label },
    { header: 'Total Berat (kg)', cell: (r) => formatNumber(r.totalKg) },
    { header: 'Jumlah Trip', cell: (r) => formatNumber(r.jumlahTrip) },
  ];

  const terbaruColumns: DataTableColumn<HasilTangkap>[] = [
    { header: 'Tanggal', cell: (h) => formatDate(h.tanggal) },
    { header: 'Kapal', cell: (h) => kapal.find((k) => k.id === h.kapalId)?.nama ?? h.kapalId },
    { header: 'Lokasi', cell: (h) => h.lokasi },
    {
      header: 'Jenis Ikan',
      cell: (h) => {
        const names = h.jenisIkan.map((j) => j.nama).join(', ');
        return (
          <span className="block max-w-48 truncate" title={names}>
            {names}
          </span>
        );
      },
    },
    { header: 'Berat (kg)', cell: (h) => formatNumber(h.jenisIkan.reduce((s, j) => s + j.beratKg, 0)) },
    { header: 'Nilai', cell: (h) => formatRupiah(h.estimasiNilai) },
    {
      header: 'Status',
      cell: (h) => (
        <StatusBadge
          label={h.status === 'verified' ? 'Terverifikasi' : 'Menunggu'}
          tone={h.status === 'verified' ? 'success' : 'warning'}
        />
      ),
    },
  ];

  const biosecurityColumns: DataTableColumn<BiosecurityCheck>[] = [
    { header: 'Tanggal', cell: (b) => formatDate(b.tanggal) },
    { header: 'Kapal', cell: (b) => kapal.find((k) => k.id === b.kapalId)?.nama ?? b.kapalId },
    { header: 'Petugas', cell: (b) => b.petugas },
    { header: 'Nomor Sertifikat', cell: (b) => b.nomorSertifikat },
    {
      header: 'Status',
      cell: (b) => (
        <StatusBadge
          label={b.hasil === 'lolos' ? 'Lolos' : 'Tidak Lolos'}
          tone={b.hasil === 'lolos' ? 'success' : 'destructive'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Hasil Tangkap' }]}
        title="Hasil Tangkap"
        description="Pantau hasil tangkapan ikan secara real-time"
        actions={
          <>
            <Link href="/hasil-tangkap/biosecurity" className={buttonVariants({ variant: 'outline' })}>
              Cek Biosecurity
            </Link>
            <Link href="/hasil-tangkap/input" className={buttonVariants()}>
              Input Hasil Tangkap
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Fish} label="Total Hasil Tangkapan" value={`${formatNumber(totalHasilTangkapKg(hasilTangkap))} kg`} accent="blue" />
        <KpiCard icon={Wallet} label="Total Nilai Tangkapan" value={formatRupiah(totalNilaiTangkapan(hasilTangkap))} accent="green" />
        <KpiCard icon={Ship} label="Rata-rata per Trip" value={`${formatNumber(Math.round(rataRataPerTripKg(hasilTangkap)))} kg`} accent="cyan" />
        <KpiCard icon={Layers} label="Jenis Ikan Tertangkap" value={`${formatNumber(komposisi.length)} Jenis`} accent="purple" />
      </div>

      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="ringkasan">
            <TabsList>
              <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
              <TabsTrigger value="jenis-ikan">Per Jenis Ikan</TabsTrigger>
              <TabsTrigger value="kapal">Per Kapal</TabsTrigger>
              <TabsTrigger value="wilayah">Per Wilayah</TabsTrigger>
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
        <CardHeader className="text-sm font-semibold">Data Hasil Tangkapan Terbaru</CardHeader>
        <CardContent>
          <DataTable data={terbaru} columns={terbaruColumns} getRowKey={(h) => h.id} pageSize={10} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">Status Biosecurity Terbaru</CardHeader>
        <CardContent>
          <DataTable data={terbaruBiosecurity} columns={biosecurityColumns} getRowKey={(b) => b.id} pageSize={10} />
        </CardContent>
      </Card>
    </div>
  );
}
