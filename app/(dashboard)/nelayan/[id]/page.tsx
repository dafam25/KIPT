'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendLineChart } from '@/components/dashboard/trend-line-chart';
import { IdCardDownloadButton } from '@/components/nelayan/id-card-download-button';
import {
  hasilTangkapForKapal, totalJamMelaut, totalNilaiTangkapan, rataRataPerTripKg,
  totalHasilTangkapKg, trenHasilTangkapHarian,
} from '@/lib/stats';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';

export default function NelayanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { nelayan, koperasi, kapal, hasilTangkap } = useData();

  const orang = nelayan.find((n) => n.id === id);

  if (!orang) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Data nelayan tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push('/nelayan')}>
          Kembali ke Daftar Nelayan
        </Button>
      </div>
    );
  }

  const koperasiNelayan = koperasi.find((k) => k.id === orang.koperasiId);
  const kapalNelayan = kapal.find((k) => k.id === orang.kapalId);
  const trips = kapalNelayan ? hasilTangkapForKapal(kapalNelayan.id, hasilTangkap) : [];
  const sortedTrips = [...trips].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const terakhir = sortedTrips[0];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Nelayan', href: '/nelayan' },
          { label: orang.nama },
        ]}
        title="Detail Nelayan ID"
        actions={
          <IdCardDownloadButton nelayan={orang} koperasiNama={koperasiNelayan?.nama} kapalNama={kapalNelayan?.nama} />
        }
      />

      <Card>
        <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr]">
          <img
            src={orang.fotoUrl || 'https://placehold.co/120x120?text=Foto'}
            alt={orang.nama}
            className="h-28 w-28 rounded-lg object-cover"
          />
          <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div><span className="text-muted-foreground">ID Nelayan</span><p className="font-medium">{orang.id}</p></div>
            <div><span className="text-muted-foreground">Nama</span><p className="font-medium">{orang.nama}</p></div>
            <div><span className="text-muted-foreground">Tempat, Tanggal Lahir</span><p className="font-medium">{orang.tempatLahir}, {formatDate(orang.tanggalLahir)}</p></div>
            <div><span className="text-muted-foreground">Alamat</span><p className="font-medium">{orang.alamat}</p></div>
            <div><span className="text-muted-foreground">No. KTP</span><p className="font-medium">{orang.nik}</p></div>
            <div><span className="text-muted-foreground">No. HP</span><p className="font-medium">{orang.noHp}</p></div>
            <div><span className="text-muted-foreground">Tanggal Bergabung</span><p className="font-medium">{formatDate(orang.tanggalBergabung)}</p></div>
            <div><span className="text-muted-foreground">Koperasi</span><p className="font-medium">{koperasiNelayan?.nama ?? '-'}</p></div>
            <div><span className="text-muted-foreground">Pendamping / Penyuluh</span><p className="font-medium">{orang.pendamping}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="text-sm font-semibold">
            Ringkasan Aktivitas Kapal
            <p className="text-xs font-normal text-muted-foreground">
              Berdasarkan aktivitas {kapalNelayan?.nama ?? 'kapal terkait'}
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Total Melaut</p><p className="text-lg font-semibold">{formatNumber(trips.length)} trip</p></div>
            <div><p className="text-muted-foreground">Aktivitas Terakhir</p><p className="text-lg font-semibold">{terakhir ? formatDate(terakhir.tanggal) : '-'}</p></div>
            <div><p className="text-muted-foreground">Total Jam Melaut</p><p className="text-lg font-semibold">{formatNumber(totalJamMelaut(trips))} jam</p></div>
            <div><p className="text-muted-foreground">Total Hasil Tangkap</p><p className="text-lg font-semibold">{formatNumber(totalHasilTangkapKg(trips))} kg</p></div>
            <div><p className="text-muted-foreground">Estimasi Nilai Tangkap</p><p className="text-lg font-semibold">{formatRupiah(totalNilaiTangkapan(trips))}</p></div>
            <div><p className="text-muted-foreground">Rata-rata / Trip</p><p className="text-lg font-semibold">{formatNumber(Math.round(rataRataPerTripKg(trips)))} kg</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-sm font-semibold">Kapal yang Digunakan</CardHeader>
          <CardContent className="text-sm">
            {kapalNelayan ? (
              <div className="space-y-1">
                <Link href={`/kapal/${kapalNelayan.id}`} className="font-medium text-primary hover:underline">
                  {kapalNelayan.nama}
                </Link>
                <p className="text-muted-foreground">ID Kapal: {kapalNelayan.id}</p>
                <p className="text-muted-foreground">Jenis: {kapalNelayan.jenis}</p>
                <p className="text-muted-foreground">GT / Ukuran: {kapalNelayan.gt} GT</p>
                <p className="text-muted-foreground">Pelabuhan Induk: {kapalNelayan.pelabuhanInduk}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Belum ada kapal terkait.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-sm font-semibold">Grafik Hasil Tangkapan</CardHeader>
        <CardContent>
          <TrendLineChart data={trenHasilTangkapHarian(trips)} />
        </CardContent>
      </Card>
    </div>
  );
}
