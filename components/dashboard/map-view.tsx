'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Kapal, KapalStatus } from '@/lib/types';
import { useData } from '@/context/data-context';
import { KAPAL_STATUS_TONE } from '@/lib/kapal-status';

// Same HSL values as --success / --warning / --destructive / --muted-foreground in app/globals.css,
// reused here (rather than duplicated as new colors) since Leaflet's divIcon needs an inline color
// string and can't reference CSS custom properties from a Tailwind class.
// Stored as bare HSL parameters (without hsl() wrapper) to allow building both solid and translucent colors.
const TONE_HSL: Record<'success' | 'warning' | 'destructive' | 'muted', string> = {
  success: '142 71% 38%',
  warning: '38 92% 42%',
  destructive: '0 72% 45%',
  muted: '215 16% 47%',
};

// Ship glyph path data reused from lucide-react's bundled "Ship" icon (ISC licensed,
// already a project dependency) so the marker renders an actual vessel silhouette
// instead of a plain dot. Inlined as a raw SVG string because Leaflet's divIcon only
// accepts HTML markup, not a React icon component.
const SHIP_GLYPH_PATHS = [
  'M12 10.189V14',
  'M12 2v3',
  'M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6',
  'M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76',
  'M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
]
  .map((d) => `<path d="${d}"/>`)
  .join('');

function vesselIconForStatus(status: KapalStatus) {
  const tone = KAPAL_STATUS_TONE[status];
  const hslParams = TONE_HSL[tone as keyof typeof TONE_HSL] ?? TONE_HSL.muted;
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:9999px;background:hsl(${hslParams});box-shadow:0 1px 4px rgba(15,23,42,0.35),0 0 0 2px white;display:flex;align-items:center;justify-content:center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${SHIP_GLYPH_PATHS}</svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

// Built once at module scope (only 4 possible KapalStatus values) so react-leaflet's Marker
// sees a stable `icon` reference across renders. If this were rebuilt per-render instead,
// react-leaflet's prop-identity check would call marker.setIcon() on every render — including
// the 4-second position-jitter interval below — tearing down and rebuilding each marker's DOM
// element and popup binding for no visual change.
const VESSEL_ICONS: Record<KapalStatus, L.DivIcon> = Object.fromEntries(
  (Object.keys(KAPAL_STATUS_TONE) as KapalStatus[]).map((s) => [s, vesselIconForStatus(s)])
) as Record<KapalStatus, L.DivIcon>;

export function MapView({
  kapal,
  height = 400,
  onSelectKapal,
}: {
  kapal: Kapal[];
  height?: number;
  onSelectKapal?: (id: string) => void;
}) {
  const { updateKapalPosisi } = useData();
  const [tileMode, setTileMode] = useState<'peta' | 'satelit'>('peta');

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
    <div style={{ height }} className="relative overflow-hidden rounded-lg border border-border">
      <div className="absolute top-2 right-2 z-[1000] flex overflow-hidden rounded-md border border-border bg-card text-xs">
        <button
          type="button"
          onClick={() => setTileMode('peta')}
          className={tileMode === 'peta' ? 'bg-primary px-3 py-1.5 text-primary-foreground' : 'px-3 py-1.5 text-muted-foreground hover:text-foreground'}
        >
          Peta
        </button>
        <button
          type="button"
          onClick={() => setTileMode('satelit')}
          className={tileMode === 'satelit' ? 'bg-primary px-3 py-1.5 text-primary-foreground' : 'px-3 py-1.5 text-muted-foreground hover:text-foreground'}
        >
          Satelit
        </button>
      </div>
      <MapContainer center={[-2.5, 118]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        {tileMode === 'peta' ? (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          />
        ) : (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
          />
        )}
        {kapal.map((k) => (
          <Marker
            key={k.id}
            position={[k.posisi.lat, k.posisi.lng]}
            icon={VESSEL_ICONS[k.status]}
            eventHandlers={onSelectKapal ? { click: () => onSelectKapal(k.id) } : undefined}
          >
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
