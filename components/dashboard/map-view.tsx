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

// Just the boat body — no cabin/wheelhouse "building" on deck. A rounded 2-tone hull
// (highlight/shadow, still reads as dimensional) topped with a small ship's wheel on a
// post (the requested reference art has one), two porthole dots, and small paddle-like
// flourishes on each side, plus a soft drop shadow for "floating on water" lift.
// Inlined as a raw SVG string because Leaflet's divIcon only accepts HTML markup, not
// a React component.
function vesselIconForStatus(status: KapalStatus) {
  const tone = KAPAL_STATUS_TONE[status];
  const hslParams = TONE_HSL[tone as keyof typeof TONE_HSL] ?? TONE_HSL.muted;
  const { light, dark } = shadePair(hslParams);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 34" width="38" height="27" style="filter:drop-shadow(0 2px 2px rgba(15,23,42,0.4))">
      <ellipse cx="24" cy="30" rx="16" ry="2.6" fill="#0F172A" opacity="0.18"/>
      <path d="M4 16 Q2 15 3 22 Q6 20 6 17 Z" fill="${dark}"/>
      <path d="M44 16 Q46 15 45 22 Q42 20 42 17 Z" fill="${dark}"/>
      <path d="M4 15 Q24 12 44 15 Q44 24 24 25.5 Q4 24 4 15 Z" fill="${dark}" stroke="#0F172A" stroke-opacity="0.3" stroke-width="0.75"/>
      <path d="M6 15.5 Q24 13.4 42 15.5 Q42 17.5 24 18.5 Q6 17.5 6 15.5 Z" fill="${light}"/>
      <circle cx="16" cy="19.5" r="1.2" fill="#0F172A" opacity="0.55"/>
      <circle cx="32" cy="19.5" r="1.2" fill="#0F172A" opacity="0.55"/>
      <line x1="24" y1="12" x2="24" y2="8.5" stroke="#5B3A1E" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="24" cy="6" r="3.4" fill="none" stroke="#5B3A1E" stroke-width="1.3"/>
      <circle cx="24" cy="6" r="1" fill="#5B3A1E"/>
      <line x1="24" y1="3" x2="24" y2="9" stroke="#5B3A1E" stroke-width="1"/>
      <line x1="21" y1="6" x2="27" y2="6" stroke="#5B3A1E" stroke-width="1"/>
      <line x1="21.8" y1="3.8" x2="26.2" y2="8.2" stroke="#5B3A1E" stroke-width="1"/>
      <line x1="26.2" y1="3.8" x2="21.8" y2="8.2" stroke="#5B3A1E" stroke-width="1"/>
    </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [38, 27],
    iconAnchor: [19, 24],
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
