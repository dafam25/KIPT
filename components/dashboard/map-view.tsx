'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Kapal } from '@/lib/types';
import { useData } from '@/context/data-context';

const vesselIcon = L.divIcon({
  className: '',
  html: '<div style="width:10px;height:10px;border-radius:9999px;background:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,0.3)"></div>',
  iconSize: [10, 10],
});

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
          <Marker key={k.id} position={[k.posisi.lat, k.posisi.lng]} icon={vesselIcon}>
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
