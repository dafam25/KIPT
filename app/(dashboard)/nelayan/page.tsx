'use client';

import Link from 'next/link';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Nelayan } from '@/lib/types';
import { formatDate } from '@/lib/format';

export default function NelayanListPage() {
  const { nelayan, koperasi, kapal } = useData();

  const columns: DataTableColumn<Nelayan>[] = [
    { header: 'ID', cell: (n) => <span className="font-mono text-xs">{n.id}</span> },
    {
      header: 'Nama',
      cell: (n) => (
        <Link href={`/nelayan/${n.id}`} className="font-medium text-primary hover:underline">
          {n.nama}
        </Link>
      ),
    },
    { header: 'Koperasi', cell: (n) => koperasi.find((k) => k.id === n.koperasiId)?.nama ?? '-' },
    { header: 'Kapal', cell: (n) => kapal.find((k) => k.id === n.kapalId)?.nama ?? '-' },
    { header: 'Bergabung', cell: (n) => formatDate(n.tanggalBergabung) },
    {
      header: 'Status',
      cell: (n) => (
        <StatusBadge
          label={n.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
          tone={n.status === 'aktif' ? 'success' : 'muted'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Nelayan' }]}
        title="Nelayan"
        description="Kelola data nelayan terdaftar"
      />
      <DataTable
        data={nelayan}
        columns={columns}
        getRowKey={(n) => n.id}
        searchPlaceholder="Cari nama atau ID nelayan..."
        filterFn={(n, q) => n.nama.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)}
      />
    </div>
  );
}
