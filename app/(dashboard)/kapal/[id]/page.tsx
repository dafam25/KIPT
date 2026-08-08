'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { KapalStatus } from '@/lib/types';
import { hasilTangkapForKapal } from '@/lib/stats';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';

const MapView = dynamic(
  () => import('@/components/dashboard/map-view').then((mod) => mod.MapView),
  { ssr: false }
);

const STATUS_LABEL: Record<KapalStatus, string> = {
  melaut: 'Aktif Melaut',
  sandar: 'Sandar',
  tidak_aktif: 'Tidak Aktif',
  perbaikan: 'Perbaikan',
};

const STATUS_TONE: Record<KapalStatus, 'success' | 'warning' | 'destructive' | 'muted'> = {
  melaut: 'success',
  sandar: 'warning',
  tidak_aktif: 'destructive',
  perbaikan: 'muted',
};

export default function KapalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { kapal, nelayan, hasilTangkap } = useData();

  const kapalItem = kapal.find((k) => k.id === id);

  if (!kapalItem) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Data kapal tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push('/kapal')}>
          Kembali ke Daftar Kapal
        </Button>
      </div>
    );
  }

  const nahkoda = nelayan.find((n) => n.id === kapalItem.nahkodaId);
  const trips = hasilTangkapForKapal(kapalItem.id, hasilTangkap);
  const recentTrips = [...trips].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Kapal', href: '/kapal' },
          { label: kapalItem.nama },
        ]}
        title="Detail Kapal"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
            Spesifikasi Kapal
            <StatusBadge label={STATUS_LABEL[kapalItem.status]} tone={STATUS_TONE[kapalItem.status]} />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
            <div><span className="text-muted-foreground">ID Kapal</span><p className="font-medium">{kapalItem.id}</p></div>
            <div><span className="text-muted-foreground">Jenis Kapal</span><p className="font-medium">{kapalItem.jenis}</p></div>
            <div><span className="text-muted-foreground">GT</span><p className="font-medium">{kapalItem.gt} GT</p></div>
            <div><span className="text-muted-foreground">Mesin</span><p className="font-medium">{kapalItem.mesinPk} PK</p></div>
            <div><span className="text-muted-foreground">Kecepatan</span><p className="font-medium">{kapalItem.kecepatanKnot} knot</p></div>
            <div><span className="text-muted-foreground">Pelabuhan Induk</span><p className="font-medium">{kapalItem.pelabuhanInduk}</p></div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Nahkoda</span>
              <p className="font-medium">
                {nahkoda ? (
                  <Link href={`/nelayan/${nahkoda.id}`} className="text-primary hover:underline">{nahkoda.nama}</Link>
                ) : '-'}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Dokumen</span>
              <div className="mt-1 flex gap-2">
                <StatusBadge label="SIUP" tone={kapalItem.dokumen.siup ? 'success' : 'muted'} />
                <StatusBadge label="SLO" tone={kapalItem.dokumen.slo ? 'success' : 'muted'} />
                <StatusBadge label="Pas Kecil" tone={kapalItem.dokumen.pasKecil ? 'success' : 'muted'} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-sm font-semibold">Posisi Terkini</CardHeader>
          <CardContent>
            <MapView kapal={[kapalItem]} height={220} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-sm font-semibold">Riwayat Hasil Tangkapan Terbaru</CardHeader>
        <CardContent>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada riwayat hasil tangkapan.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {recentTrips.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <span>{formatDate(t.tanggal)} · {t.lokasi}</span>
                  <span className="font-medium">
                    {formatNumber(t.jenisIkan.reduce((s, j) => s + j.beratKg, 0))} kg · {formatRupiah(t.estimasiNilai)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
