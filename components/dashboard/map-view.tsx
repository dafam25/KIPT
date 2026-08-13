'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Kapal } from '@/lib/types';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { KAPAL_STATUS_LABEL_KEY } from '@/lib/kapal-status';

// The vessel marker uses the actual boat asset (perahu + 2 dayung, no cabin/building)
// directly instead of a hand-drawn SVG. The source PNG now has genuine alpha
// transparency (verified by test-rendering it over white/map-gray/dark backgrounds —
// no box or halo in any case), so it's shown with object-fit: contain at its natural
// ~3:2 aspect ratio — no cropping needed — plus a drop-shadow filter (which follows the
// image's actual opaque pixels, not its bounding box) for a bit of "floating" lift.
// Built once at module scope so react-leaflet's Marker sees a stable `icon` reference
// across renders; rebuilding it per-render would make react-leaflet call
// marker.setIcon() on every render — including the 4-second position-jitter interval
// below — tearing down and rebuilding each marker's DOM element and popup binding for
// no visual change.
const VESSEL_ICON = L.divIcon({
  className: '',
  html: `<img src="/images/kapal-nelayan.png" alt="" style="display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 2px rgba(15,23,42,0.4))" />`,
  iconSize: [46, 31],
  iconAnchor: [23, 18],
});

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
  const { t } = useLanguage();

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
      <MapContainer center={[-2.5, 118]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
        />
        {kapal.map((k) => (
          <Marker
            key={k.id}
            position={[k.posisi.lat, k.posisi.lng]}
            icon={VESSEL_ICON}
            eventHandlers={onSelectKapal ? { click: () => onSelectKapal(k.id) } : undefined}
          >
            <Popup>
              <strong>{k.nama}</strong>
              <br />
              {t(KAPAL_STATUS_LABEL_KEY[k.status])}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
