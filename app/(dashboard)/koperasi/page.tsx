'use client';

import Link from 'next/link';
import { UsersRound, CheckCircle2, Users, Fish } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { Koperasi } from '@/lib/types';
import { formatNumber, formatRupiah } from '@/lib/format';
import { totalVolumeKoperasi, aktifKoperasiCount } from '@/lib/stats';

export default function KoperasiListPage() {
  const { koperasi } = useData();

  const totalAnggota = koperasi.reduce((sum, k) => sum + k.jumlahAnggota, 0);
  const totalVolume = totalVolumeKoperasi(koperasi);
  const aktifCount = aktifKoperasiCount(koperasi);

  const columns: DataTableColumn<Koperasi>[] = [
    {
      header: 'Nama Koperasi',
      cell: (k) => (
        <Link href={`/koperasi/${k.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UsersRound className="h-3.5 w-3.5" />
          </span>
          {k.nama}
        </Link>
      ),
    },
    { header: 'Lokasi', cell: (k) => k.lokasi },
    {
      header: 'Ketua',
      cell: (k) => (
        <span className="block max-w-40 truncate" title={k.ketua}>
          {k.ketua}
        </span>
      ),
    },
    { header: 'Anggota', cell: (k) => formatNumber(k.jumlahAnggota) },
    { header: 'Volume (kg)', cell: (k) => formatNumber(k.volumeKg) },
    { header: 'Nilai Transaksi', cell: (k) => formatRupiah(k.nilaiTransaksi) },
    {
      header: 'Status',
      cell: (k) => (
        <StatusBadge label={k.status} tone={k.status === 'Aktif' ? 'success' : 'muted'} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Koperasi' }]}
        title="Koperasi"
        description="Cari dan kelola data koperasi perikanan"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={UsersRound} label="Total Koperasi" value={formatNumber(koperasi.length)} deltaPercent={2.4} deltaLabel="Dibandingkan bulan lalu" accent="blue" />
        <KpiCard icon={CheckCircle2} label="Koperasi Aktif" value={formatNumber(aktifCount)} deltaPercent={1.9} deltaLabel="Dibandingkan bulan lalu" accent="green" />
        <KpiCard icon={Users} label="Anggota Terdaftar (Koperasi)" value={formatNumber(totalAnggota)} deltaPercent={3.1} deltaLabel="Dibandingkan bulan lalu" accent="cyan" />
        <KpiCard icon={Fish} label="Volume Hasil (kg)" value={formatNumber(totalVolume)} deltaPercent={6.7} deltaLabel="Dibandingkan bulan lalu" accent="purple" />
      </div>
      <DataTable
        data={koperasi}
        columns={columns}
        getRowKey={(k) => k.id}
        searchPlaceholder="Cari nama atau lokasi koperasi..."
        filterFn={(k, q) => k.nama.toLowerCase().includes(q) || k.lokasi.toLowerCase().includes(q)}
      />
    </div>
  );
}
