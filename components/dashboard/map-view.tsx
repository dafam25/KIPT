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

// Builds a light/mid/dark shade triple from a bare "H S% L%" HSL triple so the hull can
// be rendered as banded highlight/base/shadow tones instead of one flat color — a
// dependency-free way to fake rounded-hull shading (no <linearGradient>, so there's no
// risk of duplicate gradient ids when Leaflet stamps this same markup into the DOM once
// per vessel that shares a status).
function shadeTriple(hslParams: string): { light: string; mid: string; dark: string } {
  const [h, sRaw, lRaw] = hslParams.split(' ');
  const s = parseFloat(sRaw);
  const l = parseFloat(lRaw);
  const clamp = (n: number) => Math.min(94, Math.max(8, n));
  return {
    light: `hsl(${h} ${s}% ${clamp(l + 26)}%)`,
    mid: `hsl(${h} ${s}% ${clamp(l)}%)`,
    dark: `hsl(${h} ${s}% ${clamp(l - 12)}%)`,
  };
}

// A small Indonesian-style traditional fishing boat ("kapal nelayan" / "perahu cadik")
// illustration — banded hull shading, a white hull stripe, gunwale rail dots, twin
// bamboo outriggers (cadik) with floats (the single most recognizable feature of a
// small-scale Indonesian fishing vessel vs. a generic motorboat/yacht), a modest
// wood-roofed wheelhouse with one small window, a coil of net and stacked baskets on
// the open deck, mast with an antenna boom and status-colored pennant, plus water-wake
// strokes and a soft drop shadow, so vessels read as an actual fishing boat rather than
// a flat dot, plain line glyph, or glassy pleasure boat.
// True photorealistic imagery isn't achievable here (no image-generation/photo-sourcing
// capability), so this pushes the hand-authored inline SVG as far as that allows.
// Inlined as a raw SVG string because Leaflet's divIcon only accepts HTML markup.
function vesselIconForStatus(status: KapalStatus) {
  const tone = KAPAL_STATUS_TONE[status];
  const hslParams = TONE_HSL[tone as keyof typeof TONE_HSL] ?? TONE_HSL.muted;
  const { light, mid, dark } = shadeTriple(hslParams);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 60" width="42" height="39" style="filter:drop-shadow(0 2px 2px rgba(15,23,42,0.45))">
      <path d="M2 44 Q8 40 14 44" stroke="#FFFFFF" stroke-width="1.3" fill="none" opacity="0.55"/>
      <path d="M50 44 Q56 40 62 44" stroke="#FFFFFF" stroke-width="1.3" fill="none" opacity="0.55"/>
      <ellipse cx="32" cy="50" rx="22" ry="4" fill="#0F172A" opacity="0.18"/>
      <line x1="14" y1="34" x2="1" y2="43" stroke="#92652E" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="1" cy="44" rx="3.4" ry="1.5" fill="#A9744A"/>
      <line x1="50" y1="34" x2="63" y2="43" stroke="#92652E" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="63" cy="44" rx="3.4" ry="1.5" fill="#A9744A"/>
      <path d="M6 34 L58 34 L50 48 Q32 53 14 48 Z" fill="${dark}" stroke="#0F172A" stroke-opacity="0.3" stroke-width="0.75"/>
      <path d="M8 34 L56 34 L52.5 42 L11.5 42 Z" fill="${mid}"/>
      <path d="M10 34 L54 34 L52.5 37.5 L11.5 37.5 Z" fill="${light}"/>
      <path d="M12 44 Q32 47 52 44 L52 45.6 Q32 48.6 12 45.6 Z" fill="#FFFFFF" opacity="0.85"/>
      <circle cx="14" cy="36" r="0.8" fill="#1E293B" opacity="0.6"/>
      <circle cx="20" cy="36" r="0.8" fill="#1E293B" opacity="0.6"/>
      <circle cx="44" cy="36" r="0.8" fill="#1E293B" opacity="0.6"/>
      <circle cx="50" cy="36" r="0.8" fill="#1E293B" opacity="0.6"/>
      <circle cx="16" cy="30.5" r="3.2" fill="none" stroke="#92400E" stroke-width="1.1" opacity="0.85"/>
      <circle cx="16" cy="30.5" r="1.4" fill="none" stroke="#92400E" stroke-width="0.9" opacity="0.85"/>
      <ellipse cx="45" cy="32" rx="3" ry="2" fill="#B45309"/>
      <ellipse cx="49" cy="33" rx="2.6" ry="1.8" fill="#C2691E"/>
      <line x1="30" y1="3" x2="12" y2="10" stroke="#334155" stroke-width="1.1" stroke-linecap="round" opacity="0.85"/>
      <rect x="25" y="16" width="16" height="19" rx="1.4" fill="#CBD5E1"/>
      <rect x="21" y="16" width="14" height="19" rx="1.4" fill="#F1F5F9" stroke="#94A3B8" stroke-width="0.6"/>
      <path d="M19 16 L28 9 L37 16 Z" fill="#0E7490"/>
      <rect x="25.5" y="21" width="4.5" height="4.5" rx="0.6" fill="#1E293B"/>
      <rect x="26.5" y="29" width="3" height="6" rx="0.5" fill="#94A3B8"/>
      <line x1="28" y1="9" x2="28" y2="1" stroke="#334155" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M28 1 L34 3.2 L28 4.8 Z" fill="${dark}"/>
    </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [42, 39],
    iconAnchor: [21, 27],
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
