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
// rendered as a highlight/shadow two-tone instead of one flat color — a
// dependency-free way to fake rounded-hull shading (no <linearGradient>, so there's no
// risk of duplicate gradient ids when Leaflet stamps this same markup into the DOM once
// per vessel that shares a status).
function shadePair(hslParams: string): { light: string; dark: string } {
  const [h, sRaw, lRaw] = hslParams.split(' ');
  const s = parseFloat(sRaw);
  const l = parseFloat(lRaw);
  const clamp = (n: number) => Math.min(94, Math.max(8, n));
  return {
    light: `hsl(${h} ${s}% ${clamp(l + 26)}%)`,
    dark: `hsl(${h} ${s}% ${clamp(l - 12)}%)`,
  };
}

// A small dinghy/rowboat, matching the requested reference art: a rounded 2-tone hull
// (highlight/shadow, still reads as dimensional) with a pair of diagonal oars, four
// gunwale portholes, a striped life-ring on the left and a life-vest/cushion on the
// right, plus a soft drop shadow for "floating on water" lift. No wheel/cabin.
// Inlined as a raw SVG string because Leaflet's divIcon only accepts HTML markup, not
// a React component.
function vesselIconForStatus(status: KapalStatus) {
  const tone = KAPAL_STATUS_TONE[status];
  const hslParams = TONE_HSL[tone as keyof typeof TONE_HSL] ?? TONE_HSL.muted;
  const { light, dark } = shadePair(hslParams);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 30" width="42" height="24" style="filter:drop-shadow(0 2px 2px rgba(15,23,42,0.4))">
      <ellipse cx="26" cy="26" rx="17" ry="2.6" fill="#0F172A" opacity="0.18"/>
      <line x1="10" y1="10" x2="1" y2="19" stroke="#8B5A2B" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="1" cy="19" rx="2.6" ry="1.3" fill="#8B5A2B" transform="rotate(-42 1 19)"/>
      <line x1="42" y1="10" x2="51" y2="19" stroke="#8B5A2B" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="51" cy="19" rx="2.6" ry="1.3" fill="#8B5A2B" transform="rotate(42 51 19)"/>
      <path d="M8 12 Q26 9 44 12 Q44 21 26 22.5 Q8 21 8 12 Z" fill="${dark}" stroke="#0F172A" stroke-opacity="0.3" stroke-width="0.75"/>
      <path d="M10 12.5 Q26 10.8 42 12.5 Q42 14.5 26 15.5 Q10 14.5 10 12.5 Z" fill="${light}"/>
      <circle cx="14" cy="16.5" r="1.1" fill="#0F172A" opacity="0.55"/>
      <circle cx="20" cy="16.5" r="1.1" fill="#0F172A" opacity="0.55"/>
      <circle cx="32" cy="16.5" r="1.1" fill="#0F172A" opacity="0.55"/>
      <circle cx="38" cy="16.5" r="1.1" fill="#0F172A" opacity="0.55"/>
      <circle cx="17" cy="8" r="2.6" fill="none" stroke="#EA580C" stroke-width="1.8" stroke-dasharray="2 2"/>
      <circle cx="17" cy="8" r="2.6" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="2 2" stroke-dashoffset="2"/>
      <path d="M32.5 7 Q32.5 5.3 34.2 5.6 Q35.8 5.2 36.3 6.8 L35.8 9.3 Q34.2 10 32.8 9.3 Z" fill="#C2410C"/>
    </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [42, 24],
    iconAnchor: [21, 16],
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
