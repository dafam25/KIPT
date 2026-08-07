'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
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

  const value: DataContextValue = {
    nelayan,
    kapal,
    hasilTangkap,
    koperasi,
    pasarIndustri,
    notifikasi,
    addNelayan: (n) => setNelayan((prev) => [n, ...prev]),
    addKapal: (k) => setKapal((prev) => [k, ...prev]),
    addHasilTangkap: (h) => setHasilTangkap((prev) => [h, ...prev]),
    markNotifikasiDibaca: (id) =>
      setNotifikasi((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n))),
    updateKapalPosisi: (id, posisi) =>
      setKapal((prev) => prev.map((k) => (k.id === id ? { ...k, posisi } : k))),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
