'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
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
import { AVATAR_DEFAULT } from '@/lib/avatar';

export default function NelayanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { nelayan, koperasi, kapal, hasilTangkap } = useData();
  const { t } = useLanguage();

  const orang = nelayan.find((n) => n.id === id);

  if (!orang) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t('nelayan.notFound')}</p>
        <Button variant="outline" onClick={() => router.push('/nelayan')}>
          {t('nelayan.backToList')}
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
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: t('nelayan.listTitle'), href: '/nelayan' },
          { label: orang.nama },
        ]}
        title={t('nelayan.detailTitle')}
        actions={
          <IdCardDownloadButton nelayan={orang} koperasiNama={koperasiNelayan?.nama} kapalNama={kapalNelayan?.nama} />
        }
      />

      <Card>
        <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr]">
          <img
            src={orang.fotoUrl || AVATAR_DEFAULT}
            alt={orang.nama}
            className="h-28 w-28 rounded-lg border border-border object-cover"
          />
          <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div><span className="text-muted-foreground">{t('nelayan.fieldIdNelayan')}</span><p className="font-medium">{orang.id}</p></div>
            <div><span className="text-muted-foreground">{t('nelayan.fieldNama')}</span><p className="font-medium">{orang.nama}</p></div>
            <div><span className="text-muted-foreground">{t('nelayan.fieldTempatTanggalLahir')}</span><p className="font-medium">{orang.tempatLahir}, {formatDate(orang.tanggalLahir)}</p></div>
            <div><span className="text-muted-foreground">{t('nelayan.fieldAlamat')}</span><p className="font-medium">{orang.alamat}</p></div>
            <div><span className="text-muted-foreground">{t('nelayan.fieldNoKtp')}</span><p className="font-medium">{orang.nik}</p></div>
            <div><span className="text-muted-foreground">{t('nelayan.fieldNoHp')}</span><p className="font-medium">{orang.noHp}</p></div>
            <div><span className="text-muted-foreground">{t('nelayan.fieldTanggalBergabung')}</span><p className="font-medium">{formatDate(orang.tanggalBergabung)}</p></div>
            <div><span className="text-muted-foreground">{t('nelayan.fieldKoperasi')}</span><p className="font-medium">{koperasiNelayan?.nama ?? '-'}</p></div>
            <div><span className="text-muted-foreground">{t('nelayan.fieldPendamping')}</span><p className="font-medium">{orang.pendamping}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="text-sm font-semibold">
            {t('nelayan.ringkasanAktivitas')}
            <p className="text-xs font-normal text-muted-foreground">
              {t('nelayan.berdasarkanAktivitas', { kapal: kapalNelayan?.nama ?? t('nelayan.kapalTerkaitFallback') })}
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">{t('nelayan.totalMelaut')}</p><p className="text-lg font-semibold">{formatNumber(trips.length)} {t('nelayan.trip')}</p></div>
            <div><p className="text-muted-foreground">{t('nelayan.aktivitasTerakhir')}</p><p className="text-lg font-semibold">{terakhir ? formatDate(terakhir.tanggal) : '-'}</p></div>
            <div><p className="text-muted-foreground">{t('nelayan.totalJamMelaut')}</p><p className="text-lg font-semibold">{formatNumber(totalJamMelaut(trips))} {t('nelayan.jam')}</p></div>
            <div><p className="text-muted-foreground">{t('nelayan.totalHasilTangkap')}</p><p className="text-lg font-semibold">{formatNumber(totalHasilTangkapKg(trips))} kg</p></div>
            <div><p className="text-muted-foreground">{t('nelayan.estimasiNilaiTangkap')}</p><p className="text-lg font-semibold">{formatRupiah(totalNilaiTangkapan(trips))}</p></div>
            <div><p className="text-muted-foreground">{t('nelayan.rataRataPerTrip')}</p><p className="text-lg font-semibold">{formatNumber(Math.round(rataRataPerTripKg(trips)))} kg</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-sm font-semibold">{t('nelayan.kapalDigunakan')}</CardHeader>
          <CardContent className="text-sm">
            {kapalNelayan ? (
              <div className="space-y-1">
                <Link href={`/kapal/${kapalNelayan.id}`} className="font-medium text-primary hover:underline">
                  {kapalNelayan.nama}
                </Link>
                <p className="text-muted-foreground">{t('nelayan.idKapal')}: {kapalNelayan.id}</p>
                <p className="text-muted-foreground">{t('nelayan.jenis')}: {kapalNelayan.jenis}</p>
                <p className="text-muted-foreground">{t('nelayan.gtUkuran')}: {kapalNelayan.gt} GT</p>
                <p className="text-muted-foreground">{t('nelayan.pelabuhanInduk')}: {kapalNelayan.pelabuhanInduk}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">{t('nelayan.belumAdaKapal')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-sm font-semibold">{t('nelayan.grafikHasilTangkapan')}</CardHeader>
        <CardContent>
          <TrendLineChart data={trenHasilTangkapHarian(trips)} />
        </CardContent>
      </Card>
    </div>
  );
}
