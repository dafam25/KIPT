import { Cloud, Wind, Waves, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MOCK_WEATHER = { suhu: 28, kondisi: 'Cerah Berawan', angin: 12, gelombang: '0.6 - 1.2 m', arus: 'Sedang' };

export function WeatherWidget() {
  return (
    <Card>
      <CardContent className="space-y-3 p-4 text-sm">
        <div className="flex items-center gap-3">
          <Cloud className="h-6 w-6 text-sky-400" />
          <div>
            <p className="text-lg font-semibold">{MOCK_WEATHER.suhu}°C</p>
            <p className="text-muted-foreground">{MOCK_WEATHER.kondisi}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wind className="h-4 w-4" /> Kecepatan Angin <span className="ml-auto text-foreground">{MOCK_WEATHER.angin} km/h</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Waves className="h-4 w-4" /> Tinggi Gelombang <span className="ml-auto text-foreground">{MOCK_WEATHER.gelombang}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4" /> Arus Laut <span className="ml-auto text-foreground">{MOCK_WEATHER.arus}</span>
        </div>
      </CardContent>
    </Card>
  );
}
