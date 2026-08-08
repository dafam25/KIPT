'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { BIOSECURITY_CHECKLIST_ITEMS, determineBiosecurityHasil } from '@/lib/biosecurity';
import { nextBiosecurityId } from '@/lib/id';
import { formatDate } from '@/lib/format';

const METODE_OPTIONS = ['Pemeriksaan Fisik & Dokumen', 'Pemeriksaan Fisik', 'Pemeriksaan Dokumen'];

export default function BiosecurityCheckPage() {
  const router = useRouter();
  const { kapal, biosecurityCheck, addBiosecurityCheck } = useData();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kapalId, setKapalId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [petugas, setPetugas] = useState('');
  const [metode, setMetode] = useState(METODE_OPTIONS[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  function handleNextFromStep1(e: FormEvent) {
    e.preventDefault();
    if (!kapalId || !tanggal || !petugas.trim()) {
      setError('Lengkapi informasi kapal dan petugas pemeriksa terlebih dahulu.');
      return;
    }
    setError('');
    setStep(2);
  }

  function handleNextFromStep2() {
    const lengkap = BIOSECURITY_CHECKLIST_ITEMS.every((item) => values[item.key]);
    if (!lengkap) {
      setError('Lengkapi seluruh hasil pemeriksaan sebelum melanjutkan.');
      return;
    }
    setError('');
    setStep(3);
  }

  const hasil = determineBiosecurityHasil(values);
  const kapalTerpilih = kapal.find((k) => k.id === kapalId);

  function handleSubmit() {
    const nomorSertifikat = nextBiosecurityId(
      biosecurityCheck.map((b) => b.nomorSertifikat),
      new Date(tanggal),
    );
    addBiosecurityCheck({
      id: nomorSertifikat,
      kapalId,
      petugas,
      tanggal,
      checklist: BIOSECURITY_CHECKLIST_ITEMS.map((item) => ({ label: item.label, hasil: values[item.key] })),
      hasil,
      nomorSertifikat,
    });
    router.push('/hasil-tangkap');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Hasil Tangkap', href: '/hasil-tangkap' },
          { label: 'Status Lolos Biosecurity' },
        ]}
        title="Input Status Lolos Biosecurity"
        description="Catat dan verifikasi hasil pemeriksaan biosecurity kapal di pelabuhan"
      />

      <Card>
        <CardHeader className="flex flex-row gap-6 text-sm font-medium text-muted-foreground">
          <span className={step === 1 ? 'text-primary' : undefined}>1. Informasi Kapal</span>
          <span className={step === 2 ? 'text-primary' : undefined}>2. Pemeriksaan</span>
          <span className={step === 3 ? 'text-primary' : undefined}>3. Review & Simpan</span>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="bio-kapal" className="text-sm text-muted-foreground">Pilih Kapal</label>
                <Select
                  items={kapal.map((k) => ({ value: k.id, label: k.nama }))}
                  value={kapalId}
                  onValueChange={(v) => setKapalId(v ?? '')}
                >
                  <SelectTrigger id="bio-kapal" className="w-full"><SelectValue placeholder="Pilih kapal" /></SelectTrigger>
                  <SelectContent>
                    {kapal.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio-tanggal" className="text-sm text-muted-foreground">Tanggal Pemeriksaan</label>
                <Input id="bio-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio-petugas" className="text-sm text-muted-foreground">Petugas Pemeriksa</label>
                <Input id="bio-petugas" value={petugas} onChange={(e) => setPetugas(e.target.value)} placeholder="Nama petugas" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio-metode" className="text-sm text-muted-foreground">Metode Pemeriksaan</label>
                <Select value={metode} onValueChange={(v) => setMetode(v ?? metode)}>
                  <SelectTrigger id="bio-metode" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METODE_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Lanjut</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {BIOSECURITY_CHECKLIST_ITEMS.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <label htmlFor={`bio-check-${item.key}`} className="text-sm text-muted-foreground">{item.label}</label>
                    <Select
                      value={values[item.key] ?? ''}
                      onValueChange={(v) => setValues((prev) => ({ ...prev, [item.key]: v ?? '' }))}
                    >
                      <SelectTrigger id={`bio-check-${item.key}`} className="w-full"><SelectValue placeholder="Pilih hasil" /></SelectTrigger>
                      <SelectContent>
                        {item.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                <Button type="button" onClick={handleNextFromStep2}>Lanjut ke Review</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-muted-foreground">Kapal</span><br /><span className="font-medium">{kapalTerpilih?.nama ?? '-'}</span></p>
                <p><span className="text-muted-foreground">Petugas</span><br /><span className="font-medium">{petugas}</span></p>
                <p><span className="text-muted-foreground">Tanggal</span><br /><span className="font-medium">{formatDate(tanggal)}</span></p>
                <p><span className="text-muted-foreground">Metode</span><br /><span className="font-medium">{metode}</span></p>
              </div>
              <div className="space-y-1 rounded-lg border border-border p-3">
                {BIOSECURITY_CHECKLIST_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{values[item.key]}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span>Status Lolos Biosecurity</span>
                <StatusBadge label={hasil === 'lolos' ? 'Lolos' : 'Tidak Lolos'} tone={hasil === 'lolos' ? 'success' : 'destructive'} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Kembali</Button>
                <Button type="button" onClick={handleSubmit}>Simpan</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
