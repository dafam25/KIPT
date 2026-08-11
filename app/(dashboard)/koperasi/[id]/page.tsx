'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Nelayan } from '@/lib/types';
import { formatNumber, formatRupiah } from '@/lib/format';
import { peringkatVolume } from '@/lib/stats';
import { AVATAR_DEFAULT } from '@/lib/avatar';

export default function KoperasiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { koperasi, nelayan, kapal } = useData();

  const item = koperasi.find((k) => k.id === id);

  if (!item) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Data koperasi tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push('/koperasi')}>
          Kembali ke Daftar Koperasi
        </Button>
      </div>
    );
  }

  const anggota = nelayan.filter((n) => n.koperasiId === item.id);
  const peringkat = peringkatVolume(koperasi, item.id);

  const anggotaColumns: DataTableColumn<Nelayan>[] = [
    {
      header: 'Nama',
      cell: (n) => (
        <Link href={`/nelayan/${n.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
          <img
            src={n.fotoUrl || AVATAR_DEFAULT}
            alt={n.nama}
            className="h-6 w-6 shrink-0 rounded-full border border-border object-cover"
          />
          {n.nama}
        </Link>
      ),
    },
    { header: 'Kapal', cell: (n) => kapal.find((k) => k.id === n.kapalId)?.nama ?? '-' },
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
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Koperasi', href: '/koperasi' },
          { label: item.nama },
        ]}
        title="Detail Koperasi"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
          {item.nama}
          <StatusBadge label={item.status} tone={item.status === 'Aktif' ? 'success' : 'muted'} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
          <div><span className="text-muted-foreground">Lokasi</span><p className="font-medium">{item.lokasi}</p></div>
          <div><span className="text-muted-foreground">Ketua</span><p className="font-medium">{item.ketua}</p></div>
          <div><span className="text-muted-foreground">Anggota Terdaftar (Koperasi)</span><p className="font-medium">{formatNumber(item.jumlahAnggota)}</p></div>
          <div><span className="text-muted-foreground">Volume Hasil</span><p className="font-medium">{formatNumber(item.volumeKg)} kg</p></div>
          <div><span className="text-muted-foreground">Nilai Transaksi</span><p className="font-medium">{formatRupiah(item.nilaiTransaksi)}</p></div>
          <div><span className="text-muted-foreground">Peringkat Volume</span><p className="font-medium">#{peringkat} dari {koperasi.length}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">
          Anggota Nelayan Terhubung ({anggota.length})
          <p className="text-xs font-normal text-muted-foreground">
            Nelayan yang tercatat di sistem Digital Fisherman ID
          </p>
        </CardHeader>
        <CardContent>
          {anggota.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada nelayan terdaftar di koperasi ini.</p>
          ) : (
            <DataTable data={anggota} columns={anggotaColumns} getRowKey={(n) => n.id} pageSize={10} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
