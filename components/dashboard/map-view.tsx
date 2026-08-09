'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Kapal, KapalStatus } from '@/lib/types';
import { useData } from '@/context/data-context';
import { KAPAL_STATUS_TONE } from '@/lib/kapal-status';

// Same HSL values as --success / --warning / --destructive / --muted-foreground in app/globals.css,
// reused here (rather than duplicated as new colors) since Leaflet's divIcon needs an inline color
// string and can't reference CSS custom properties from a Tailwind class.
const TONE_COLOR: Record<'success' | 'warning' | 'destructive' | 'muted', string> = {
  success: 'hsl(142 71% 45%)',
  warning: 'hsl(38 92% 50%)',
  destructive: 'hsl(0 72% 51%)',
  muted: 'hsl(215 20% 65%)',
};

function vesselIconForStatus(status: KapalStatus) {
  const tone = KAPAL_STATUS_TONE[status];
  const color = TONE_COLOR[tone as keyof typeof TONE_COLOR] ?? TONE_COLOR.muted;
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px ${color}4d"></div>`,
    iconSize: [10, 10],
  });
}

export function MapView({ kapal, height = 400 }: { kapal: Kapal[]; height?: number }) {
  const { updateKapalPosisi } = useData();

  useEffect(() => {
    const interval = setInterval(() => {
      kapal
        .filter((k) => k.status === 'melaut')
        .forEach((k) => {
          const jitterLat = k.posisi.lat + (Math.random() - 0.5) * 0.02;
          const jitterLng = k.posisi.lng + (Math.random() - 0.5) * 0.02;
          updateKapalPosisi(k.id, { lat: jitterLat, lng: jitterLng });
        });
    }, 4000);
    return () => clearInterval(interval);
  }, [kapal, updateKapalPosisi]);

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-border">
      <MapContainer center={[-2.5, 118]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        {kapal.map((k) => (
          <Marker key={k.id} position={[k.posisi.lat, k.posisi.lng]} icon={vesselIconForStatus(k.status)}>
            <Popup>
              <strong>{k.nama}</strong>
              <br />
              {k.status === 'melaut' ? 'Aktif Melaut' : k.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
