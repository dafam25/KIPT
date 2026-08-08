'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber, formatRupiah } from '@/lib/format';
import { peringkatVolume } from '@/lib/stats';

export default function PasarIndustriDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { pasarIndustri } = useData();

  const item = pasarIndustri.find((p) => p.id === id);

  if (!item) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Data pasar/industri tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push('/pasar-industri')}>
          Kembali ke Daftar Pasar / Industri
        </Button>
      </div>
    );
  }

  const peringkat = peringkatVolume(pasarIndustri, item.id);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pasar / Industri', href: '/pasar-industri' },
          { label: item.nama },
        ]}
        title="Detail Pasar / Industri"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
          {item.nama}
          <StatusBadge label={item.status} tone={item.status === 'Aktif' ? 'success' : 'muted'} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
          <div><span className="text-muted-foreground">Jenis</span><p className="font-medium">{item.jenis}</p></div>
          <div><span className="text-muted-foreground">Lokasi</span><p className="font-medium">{item.lokasi}</p></div>
          <div><span className="text-muted-foreground">Pengelola</span><p className="font-medium">{item.pengelola}</p></div>
          <div><span className="text-muted-foreground">Volume Distribusi</span><p className="font-medium">{formatNumber(item.volumeKg)} kg</p></div>
          <div><span className="text-muted-foreground">Nilai Transaksi</span><p className="font-medium">{formatRupiah(item.nilaiTransaksi)}</p></div>
          <div><span className="text-muted-foreground">Peringkat Volume</span><p className="font-medium">#{peringkat} dari {pasarIndustri.length}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
