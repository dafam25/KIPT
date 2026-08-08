'use client';

import Link from 'next/link';
import { Building2, CheckCircle2, Fish, Wallet } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { PasarIndustri } from '@/lib/types';
import { formatNumber, formatRupiah } from '@/lib/format';

export default function PasarIndustriListPage() {
  const { pasarIndustri } = useData();

  const totalVolume = pasarIndustri.reduce((sum, p) => sum + p.volumeKg, 0);
  const totalNilai = pasarIndustri.reduce((sum, p) => sum + p.nilaiTransaksi, 0);
  const aktifCount = pasarIndustri.filter((p) => p.status === 'Aktif').length;

  const columns: DataTableColumn<PasarIndustri>[] = [
    {
      header: 'Nama',
      cell: (p) => (
        <Link href={`/pasar-industri/${p.id}`} className="font-medium text-primary hover:underline">
          {p.nama}
        </Link>
      ),
    },
    { header: 'Jenis', cell: (p) => p.jenis },
    { header: 'Lokasi', cell: (p) => p.lokasi },
    { header: 'Pengelola', cell: (p) => p.pengelola },
    { header: 'Volume (kg)', cell: (p) => formatNumber(p.volumeKg) },
    { header: 'Nilai Transaksi', cell: (p) => formatRupiah(p.nilaiTransaksi) },
    {
      header: 'Status',
      cell: (p) => <StatusBadge label={p.status} tone={p.status === 'Aktif' ? 'success' : 'muted'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pasar / Industri' }]}
        title="Pasar / Industri"
        description="Cari dan kelola data pasar dan industri hasil perikanan"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Building2} label="Total Pasar / Industri" value={formatNumber(pasarIndustri.length)} accent="blue" />
        <KpiCard icon={CheckCircle2} label="Aktif" value={formatNumber(aktifCount)} accent="green" />
        <KpiCard icon={Fish} label="Volume Distribusi (kg)" value={formatNumber(totalVolume)} accent="cyan" />
        <KpiCard icon={Wallet} label="Nilai Transaksi" value={formatRupiah(totalNilai)} accent="purple" />
      </div>
      <DataTable
        data={pasarIndustri}
        columns={columns}
        getRowKey={(p) => p.id}
        searchPlaceholder="Cari nama atau lokasi pasar/industri..."
        filterFn={(p, q) => p.nama.toLowerCase().includes(q) || p.lokasi.toLowerCase().includes(q)}
      />
    </div>
  );
}
