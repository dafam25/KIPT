'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { hasilTangkapForKapal, totalHasilTangkapKg } from '@/lib/stats';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';
import { KAPAL_STATUS_LABEL_KEY, KAPAL_STATUS_TONE } from '@/lib/kapal-status';

const MapView = dynamic(
  () => import('@/components/dashboard/map-view').then((mod) => mod.MapView),
  { ssr: false }
);

export default function KapalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { kapal, nelayan, hasilTangkap } = useData();
  const { t } = useLanguage();

  const kapalItem = kapal.find((k) => k.id === id);

  if (!kapalItem) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t('kapal.notFound')}</p>
        <Button variant="outline" onClick={() => router.push('/kapal')}>
          {t('kapal.backToList')}
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
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: t('kapal.listTitle'), href: '/kapal' },
          { label: kapalItem.nama },
        ]}
        title={t('kapal.detailTitle')}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
            {t('kapal.spesifikasiKapal')}
            <StatusBadge label={t(KAPAL_STATUS_LABEL_KEY[kapalItem.status])} tone={KAPAL_STATUS_TONE[kapalItem.status]} />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
            <div><span className="text-muted-foreground">{t('kapal.fieldIdKapal')}</span><p className="font-medium">{kapalItem.id}</p></div>
            <div><span className="text-muted-foreground">{t('kapal.fieldJenisKapal')}</span><p className="font-medium">{kapalItem.jenis}</p></div>
            <div><span className="text-muted-foreground">{t('kapal.fieldGt')}</span><p className="font-medium">{kapalItem.gt} GT</p></div>
            <div><span className="text-muted-foreground">{t('kapal.fieldMesin')}</span><p className="font-medium">{kapalItem.mesinPk} PK</p></div>
            <div><span className="text-muted-foreground">{t('kapal.fieldKecepatan')}</span><p className="font-medium">{kapalItem.kecepatanKnot} knot</p></div>
            <div><span className="text-muted-foreground">{t('kapal.fieldPelabuhanInduk')}</span><p className="font-medium">{kapalItem.pelabuhanInduk}</p></div>
            <div className="col-span-2">
              <span className="text-muted-foreground">{t('kapal.fieldNahkoda')}</span>
              <p className="font-medium">
                {nahkoda ? (
                  <Link href={`/nelayan/${nahkoda.id}`} className="text-primary hover:underline">{nahkoda.nama}</Link>
                ) : '-'}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">{t('kapal.fieldDokumen')}</span>
              <div className="mt-1 flex gap-2">
                <StatusBadge label="SIUP" tone={kapalItem.dokumen.siup ? 'success' : 'muted'} />
                <StatusBadge label="SLO" tone={kapalItem.dokumen.slo ? 'success' : 'muted'} />
                <StatusBadge label="Pas Kecil" tone={kapalItem.dokumen.pasKecil ? 'success' : 'muted'} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-sm font-semibold">{t('kapal.posisiTerkini')}</CardHeader>
          <CardContent>
            <MapView kapal={[kapalItem]} height={220} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-sm font-semibold">{t('kapal.riwayatHasilTangkapan')}</CardHeader>
        <CardContent>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('kapal.belumAdaRiwayat')}</p>
          ) : (
            <div className="space-y-2 text-sm">
              {recentTrips.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <span>{formatDate(t.tanggal)} · {t.lokasi}</span>
                  <span className="font-medium">
                    {formatNumber(totalHasilTangkapKg([t]))} kg · {formatRupiah(t.estimasiNilai)}
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
