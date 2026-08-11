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

// Builds a light/dark shade pair from a bare "H S% L%" HSL triple so the hull can be
// rendered with a two-tone highlight (top) / shadow (bottom) fill instead of one flat
// color — a simple, dependency-free way to give the flat SVG boat some 3D depth.
function shadePair(hslParams: string): { light: string; dark: string } {
  const [h, sRaw, lRaw] = hslParams.split(' ');
  const s = parseFloat(sRaw);
  const l = parseFloat(lRaw);
  const clamp = (n: number) => Math.min(94, Math.max(8, n));
  return {
    light: `hsl(${h} ${s}% ${clamp(l + 22)}%)`,
    dark: `hsl(${h} ${s}% ${clamp(l - 8)}%)`,
  };
}

// A small shaded boat illustration (hull with highlight/shadow tones, cabin with
// windows, mast + pennant) instead of a plain dot or a flat line-art glyph, so vessels
// read as an actual 3D-looking ship on the map. Inlined as a raw SVG string because
// Leaflet's divIcon only accepts HTML markup, not a React component.
function vesselIconForStatus(status: KapalStatus) {
  const tone = KAPAL_STATUS_TONE[status];
  const hslParams = TONE_HSL[tone as keyof typeof TONE_HSL] ?? TONE_HSL.muted;
  const { light, dark } = shadePair(hslParams);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 40" width="36" height="30" style="filter:drop-shadow(0 2px 2px rgba(15,23,42,0.45))">
      <ellipse cx="24" cy="35" rx="17" ry="3" fill="#0F172A" opacity="0.18"/>
      <path d="M5 22 L43 22 L37 33 Q24 37.5 11 33 Z" fill="${dark}" stroke="#0F172A" stroke-opacity="0.3" stroke-width="0.75"/>
      <path d="M8 22 L40 22 L38.5 26 L9.5 26 Z" fill="${light}"/>
      <rect x="18" y="6" width="16" height="15" rx="2" fill="#CBD5E1"/>
      <rect x="15" y="6" width="14" height="15" rx="2" fill="#F8FAFC" stroke="#94A3B8" stroke-width="0.6"/>
      <rect x="18" y="11" width="3.5" height="3.5" rx="0.6" fill="#1D4ED8"/>
      <rect x="24" y="11" width="3.5" height="3.5" rx="0.6" fill="#1D4ED8"/>
      <line x1="22" y1="6" x2="22" y2="1" stroke="#334155" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M22 1 L28 3 L22 4.5 Z" fill="${dark}"/>
    </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [36, 30],
    iconAnchor: [18, 20],
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
