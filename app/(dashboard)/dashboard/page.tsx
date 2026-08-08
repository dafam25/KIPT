'use client';

import { useMemo } from 'react';
import { Users, Ship, Fish, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useData } from '@/context/data-context';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendLineChart } from '@/components/dashboard/trend-line-chart';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
import { NotificationFeed } from '@/components/dashboard/notification-feed';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  totalNelayan, totalKapal, totalHasilTangkapKg, kapalMelautCount,
  komposisiHasilTangkap, trenHasilTangkapHarian,
} from '@/lib/stats';
import { formatNumber } from '@/lib/format';

const MapView = dynamic(
  () => import('@/components/dashboard/map-view').then((mod) => mod.MapView),
  { ssr: false }
);

export default function DashboardPage() {
  const { nelayan, kapal, hasilTangkap } = useData();
  const trenData = useMemo(() => trenHasilTangkapHarian(hasilTangkap), [hasilTangkap]);
  const komposisiData = useMemo(() => komposisiHasilTangkap(hasilTangkap), [hasilTangkap]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Total Nelayan" value={formatNumber(totalNelayan(nelayan))} deltaPercent={8.2} deltaLabel="Dibandingkan bulan lalu" accent="blue" />
        <KpiCard icon={Ship} label="Total Kapal" value={formatNumber(totalKapal(kapal))} deltaPercent={6.7} deltaLabel="Dibandingkan bulan lalu" accent="green" />
        <KpiCard icon={Fish} label="Total Hasil Tangkapan" value={`${formatNumber(totalHasilTangkapKg(hasilTangkap))} kg`} deltaPercent={12.5} deltaLabel="Dibandingkan kemarin" accent="purple" />
        <KpiCard icon={MapPin} label="Kapal Melaut" value={formatNumber(kapalMelautCount(kapal))} deltaPercent={4.3} deltaLabel="Kapal aktif" accent="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapView kapal={kapal} height={420} />
        </div>
        <WeatherWidget />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="text-sm font-semibold">Grafik Hasil Tangkapan (kg)</CardHeader>
          <CardContent>
            <TrendLineChart data={trenData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-sm font-semibold">Komposisi Hasil Tangkapan</CardHeader>
          <CardContent>
            <DonutChart data={komposisiData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-sm font-semibold">Notifikasi & Peringatan</CardHeader>
        <CardContent>
          <NotificationFeed limit={5} />
        </CardContent>
      </Card>
    </div>
  );
}
