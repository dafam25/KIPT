'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { nelayanData } from '@/lib/mock-data/nelayan';
import { kapalData } from '@/lib/mock-data/kapal';
import { hasilTangkapData } from '@/lib/mock-data/hasil-tangkap';
import { koperasiData } from '@/lib/mock-data/koperasi';
import { pasarIndustriData } from '@/lib/mock-data/pasar-industri';
import { notifikasiData } from '@/lib/mock-data/notifikasi';
import type { Nelayan, Kapal, HasilTangkap, Koperasi, PasarIndustri, Notifikasi } from '@/lib/types';

interface DataContextValue {
  nelayan: Nelayan[];
  kapal: Kapal[];
  hasilTangkap: HasilTangkap[];
  koperasi: Koperasi[];
  pasarIndustri: PasarIndustri[];
  notifikasi: Notifikasi[];
  addNelayan: (n: Nelayan) => void;
  addKapal: (k: Kapal) => void;
  addHasilTangkap: (h: HasilTangkap) => void;
  markNotifikasiDibaca: (id: string) => void;
  updateKapalPosisi: (id: string, posisi: { lat: number; lng: number }) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [nelayan, setNelayan] = useState<Nelayan[]>(nelayanData);
  const [kapal, setKapal] = useState<Kapal[]>(kapalData);
  const [hasilTangkap, setHasilTangkap] = useState<HasilTangkap[]>(hasilTangkapData);
  const [koperasi] = useState<Koperasi[]>(koperasiData);
  const [pasarIndustri] = useState<PasarIndustri[]>(pasarIndustriData);
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>(notifikasiData);

  const addNelayan = useCallback((n: Nelayan) => setNelayan((prev) => [n, ...prev]), []);
  const addKapal = useCallback((k: Kapal) => setKapal((prev) => [k, ...prev]), []);
  const addHasilTangkap = useCallback((h: HasilTangkap) => setHasilTangkap((prev) => [h, ...prev]), []);
  const markNotifikasiDibaca = useCallback(
    (id: string) => setNotifikasi((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n))),
    []
  );
  const updateKapalPosisi = useCallback(
    (id: string, posisi: { lat: number; lng: number }) =>
      setKapal((prev) => prev.map((k) => (k.id === id ? { ...k, posisi } : k))),
    []
  );

  const value: DataContextValue = useMemo(
    () => ({
      nelayan,
      kapal,
      hasilTangkap,
      koperasi,
      pasarIndustri,
      notifikasi,
      addNelayan,
      addKapal,
      addHasilTangkap,
      markNotifikasiDibaca,
      updateKapalPosisi,
    }),
    [
      nelayan,
      kapal,
      hasilTangkap,
      koperasi,
      pasarIndustri,
      notifikasi,
      addNelayan,
      addKapal,
      addHasilTangkap,
      markNotifikasiDibaca,
      updateKapalPosisi,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
