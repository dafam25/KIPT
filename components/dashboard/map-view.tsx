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
const TONE_HSL: Record<'success' | 'warning' | 'destructive' | 'muted', string> = {
  success: '142 71% 38%',
  warning: '38 92% 42%',
  destructive: '0 72% 45%',
  muted: '215 16% 47%',
};

// Builds a light/mid/dark wood-tone shade triple from a bare "H S% L%" HSL triple so
// the hull reads as a rounded wooden cross-section (highlight plank at the waterline,
// base tone, shadowed keel) instead of one flat color — dependency-free (no
// <linearGradient> defs, so no risk of duplicate gradient ids when Leaflet stamps this
// markup into the DOM once per vessel that shares a status).
function shadeTriple(hslParams: string): { light: string; mid: string; dark: string } {
  const [h, sRaw, lRaw] = hslParams.split(' ');
  const s = parseFloat(sRaw);
  const l = parseFloat(lRaw);
  const clamp = (n: number) => Math.min(94, Math.max(8, n));
  return {
    light: `hsl(${h} ${s}% ${clamp(l + 24)}%)`,
    mid: `hsl(${h} ${s}% ${clamp(l)}%)`,
    dark: `hsl(${h} ${s}% ${clamp(l - 16)}%)`,
  };
}

// A traditional Indonesian sampan — a narrow, symmetric, pointed-both-ends wooden hull
// (not the wide rounded Western dinghy shape) with visible plank lines for a bit of
// wood-grain realism, two simple dayung (paddles) resting against the sides, and a
// soft drop shadow with water ripples for "floating" lift. No life-ring/cushion — those
// are Western pleasure-boat trim, not part of a real sampan. Status-tinted hull shading
// is back (lost when this was briefly a fixed-color PNG) so vessels stay
// distinguishable by status at a glance, same as the rest of the app's color coding.
// True photorealistic 3D rendering isn't achievable here (no image-generation/photo-
// sourcing capability) — this is the ceiling for a hand-authored inline SVG, which is
// what Leaflet's divIcon requires (raw HTML markup, not a React component).
function vesselIconForStatus(status: KapalStatus) {
  const tone = KAPAL_STATUS_TONE[status];
  const hslParams = TONE_HSL[tone as keyof typeof TONE_HSL] ?? TONE_HSL.muted;
  const { light, mid, dark } = shadeTriple(hslParams);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 26" width="46" height="21" style="filter:drop-shadow(0 2px 2px rgba(15,23,42,0.4))">
      <ellipse cx="28" cy="23" rx="20" ry="2.4" fill="#0F172A" opacity="0.18"/>
      <path d="M3 15 Q7 12.5 12 13" stroke="#FFFFFF" stroke-width="1" fill="none" opacity="0.5"/>
      <path d="M53 15 Q49 12.5 44 13" stroke="#FFFFFF" stroke-width="1" fill="none" opacity="0.5"/>
      <line x1="12" y1="10" x2="2" y2="19.5" stroke="#6B4423" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="2" cy="19.5" rx="2.6" ry="1.2" fill="#6B4423" transform="rotate(-40 2 19.5)"/>
      <line x1="44" y1="10" x2="54" y2="19.5" stroke="#6B4423" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="54" cy="19.5" rx="2.6" ry="1.2" fill="#6B4423" transform="rotate(40 54 19.5)"/>
      <path d="M2 13 Q10 8.5 28 8.5 Q46 8.5 54 13 Q46 18.5 28 19 Q10 18.5 2 13 Z" fill="${dark}" stroke="#0F172A" stroke-opacity="0.3" stroke-width="0.6"/>
      <path d="M4 13 Q12 9.5 28 9.5 Q44 9.5 52 13 Q44 16.8 28 17.2 Q12 16.8 4 13 Z" fill="${mid}"/>
      <path d="M6 12.3 Q14 10.3 28 10.3 Q42 10.3 50 12.3 Q42 13.3 28 13.6 Q14 13.3 6 12.3 Z" fill="${light}"/>
      <path d="M6 15 Q28 17 50 15" stroke="#0F172A" stroke-width="0.5" fill="none" opacity="0.25"/>
      <path d="M8 16.5 Q28 18.3 48 16.5" stroke="#0F172A" stroke-width="0.5" fill="none" opacity="0.2"/>
    </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [46, 21],
    iconAnchor: [23, 15],
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
