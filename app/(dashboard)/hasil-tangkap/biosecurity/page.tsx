'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Stepper } from '@/components/shared/stepper';
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
  const { t } = useLanguage();
  const CHECKLIST_LABEL_KEYS: Record<string, string> = {
    kebersihanKapal: 'biosecurity.checklistLabels.kebersihanKapal',
    airBallast: 'biosecurity.checklistLabels.airBallast',
    alatTangkap: 'biosecurity.checklistLabels.alatTangkap',
    dokumenKesehatan: 'biosecurity.checklistLabels.dokumenKesehatan',
    hamaPenyakit: 'biosecurity.checklistLabels.hamaPenyakit',
    limbahBuangan: 'biosecurity.checklistLabels.limbahBuangan',
    awakKapal: 'biosecurity.checklistLabels.awakKapal',
  };

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
      setError(t('biosecurity.errorLengkapiInfo'));
      return;
    }
    setError('');
    setStep(2);
  }

  function handleNextFromStep2() {
    const lengkap = BIOSECURITY_CHECKLIST_ITEMS.every((item) => values[item.key]);
    if (!lengkap) {
      setError(t('biosecurity.errorLengkapiPemeriksaan'));
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
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        crumbs={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: t('hasilTangkap.title'), href: '/hasil-tangkap' },
          { label: t('biosecurity.title') },
        ]}
        title={t('biosecurity.title')}
        description={t('biosecurity.description')}
      />

      <Card>
        <CardHeader>
          <Stepper
            steps={[{ label: t('biosecurity.stepInformasiKapal') }, { label: t('biosecurity.stepPemeriksaan') }, { label: t('biosecurity.stepReviewSimpan') }]}
            currentStep={step}
          />
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="bio-kapal" className="text-sm text-muted-foreground">{t('biosecurity.pilihKapal')}</label>
                <Select
                  items={kapal.map((k) => ({ value: k.id, label: k.nama }))}
                  value={kapalId}
                  onValueChange={(v) => setKapalId(v ?? '')}
                >
                  <SelectTrigger id="bio-kapal" className="w-full"><SelectValue placeholder={t('biosecurity.placeholderPilihKapal')} /></SelectTrigger>
                  <SelectContent>
                    {kapal.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio-tanggal" className="text-sm text-muted-foreground">{t('biosecurity.tanggalPemeriksaan')}</label>
                <Input id="bio-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio-petugas" className="text-sm text-muted-foreground">{t('biosecurity.petugasPemeriksa')}</label>
                <Input id="bio-petugas" value={petugas} onChange={(e) => setPetugas(e.target.value)} placeholder={t('biosecurity.namaPetugasPlaceholder')} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio-metode" className="text-sm text-muted-foreground">{t('biosecurity.metodePemeriksaan')}</label>
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
                <Button type="submit">{t('biosecurity.lanjut')}</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {BIOSECURITY_CHECKLIST_ITEMS.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <label htmlFor={`bio-check-${item.key}`} className="text-sm text-muted-foreground">{t(CHECKLIST_LABEL_KEYS[item.key])}</label>
                    <Select
                      value={values[item.key] ?? ''}
                      onValueChange={(v) => setValues((prev) => ({ ...prev, [item.key]: v ?? '' }))}
                    >
                      <SelectTrigger id={`bio-check-${item.key}`} className="w-full"><SelectValue placeholder={t('biosecurity.placeholderPilihHasil')} /></SelectTrigger>
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
                <Button type="button" variant="outline" onClick={() => setStep(1)}>{t('biosecurity.kembali')}</Button>
                <Button type="button" onClick={handleNextFromStep2}>{t('biosecurity.lanjutKeReview')}</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-muted-foreground">{t('biosecurity.kapal')}</span><br /><span className="font-medium">{kapalTerpilih?.nama ?? '-'}</span></p>
                <p><span className="text-muted-foreground">{t('biosecurity.petugas')}</span><br /><span className="font-medium">{petugas}</span></p>
                <p><span className="text-muted-foreground">{t('biosecurity.tanggal')}</span><br /><span className="font-medium">{formatDate(tanggal)}</span></p>
                <p><span className="text-muted-foreground">{t('biosecurity.metode')}</span><br /><span className="font-medium">{metode}</span></p>
              </div>
              <div className="space-y-1 rounded-lg border border-border p-3">
                {BIOSECURITY_CHECKLIST_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t(CHECKLIST_LABEL_KEYS[item.key])}</span>
                    <span className="font-medium">{values[item.key]}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span>{t('biosecurity.statusLolosBiosecurity')}</span>
                <StatusBadge label={hasil === 'lolos' ? t('status.lolos') : t('status.tidakLolos')} tone={hasil === 'lolos' ? 'success' : 'destructive'} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>{t('biosecurity.kembali')}</Button>
                <Button type="button" onClick={handleSubmit}>{t('biosecurity.simpan')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
