'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { Stepper } from '@/components/shared/stepper';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { JENIS_IKAN_OPTIONS } from '@/lib/jenis-ikan';
import { generateLocalId } from '@/lib/id';
import { formatNumber, formatRupiah } from '@/lib/format';
import type { JenisIkanTangkapan } from '@/lib/types';

const KONDISI_OPTIONS: JenisIkanTangkapan['kondisi'][] = ['Segar', 'Tidak ada hasil'];
const NILAI_PER_KG = 25000;

interface IkanRow {
  nama: string;
  beratKg: string;
  jumlahEkor: string;
  kondisi: JenisIkanTangkapan['kondisi'];
}

function emptyRow(): IkanRow {
  return { nama: JENIS_IKAN_OPTIONS[0], beratKg: '', jumlahEkor: '', kondisi: 'Segar' };
}

export default function InputHasilTangkapPage() {
  const router = useRouter();
  const { kapal, addHasilTangkap } = useData();
  const { t } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kapalId, setKapalId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [rows, setRows] = useState<IkanRow[]>([emptyRow()]);
  const [error, setError] = useState('');

  function handleNextFromStep1(e: FormEvent) {
    e.preventDefault();
    if (!kapalId || !tanggal || !waktuMulai || !waktuSelesai || !lokasi.trim()) {
      setError(t('input.errorLengkapiTrip'));
      return;
    }
    setError('');
    setStep(2);
  }

  function handleNextFromStep2() {
    const valid = rows.every((r) => r.nama && Number(r.beratKg) > 0 && Number(r.jumlahEkor) > 0);
    if (!valid) {
      setError(t('input.errorLengkapiIkan'));
      return;
    }
    setError('');
    setStep(3);
  }

  function updateRow(index: number, patch: Partial<IkanRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const totalBerat = rows.reduce((s, r) => s + (Number(r.beratKg) || 0), 0);
  const estimasiNilai = totalBerat * NILAI_PER_KG;
  const kapalTerpilih = kapal.find((k) => k.id === kapalId);

  function handleSubmit() {
    addHasilTangkap({
      id: generateLocalId('HT'),
      kapalId,
      tanggal,
      waktuMulai,
      waktuSelesai,
      lokasi,
      jenisIkan: rows.map((r) => ({
        nama: r.nama,
        beratKg: Number(r.beratKg) || 0,
        jumlahEkor: Number(r.jumlahEkor) || 0,
        kondisi: r.kondisi,
      })),
      estimasiNilai,
      status: 'pending',
    });
    router.push('/hasil-tangkap');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        crumbs={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: t('hasilTangkap.title'), href: '/hasil-tangkap' },
          { label: t('input.title') },
        ]}
        title={t('input.title')}
        description={t('input.description')}
      />

      <Card>
        <CardHeader>
          <Stepper
            steps={[{ label: t('input.stepDataKapalTrip') }, { label: t('input.stepDetailIkan') }, { label: t('input.stepReviewSimpan') }]}
            currentStep={step}
          />
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="input-kapal" className="text-sm text-muted-foreground">{t('input.pilihKapal')}</label>
                <Select
                  items={kapal.map((k) => ({ value: k.id, label: k.nama }))}
                  value={kapalId}
                  onValueChange={(v) => setKapalId(v ?? '')}
                >
                  <SelectTrigger id="input-kapal" className="w-full"><SelectValue placeholder={t('input.placeholderPilihKapal')} /></SelectTrigger>
                  <SelectContent>
                    {kapal.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="input-tanggal" className="text-sm text-muted-foreground">{t('input.tanggalTangkap')}</label>
                <Input id="input-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="input-waktu-mulai" className="text-sm text-muted-foreground">{t('input.waktuMulai')}</label>
                <Input id="input-waktu-mulai" type="time" value={waktuMulai} onChange={(e) => setWaktuMulai(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="input-waktu-selesai" className="text-sm text-muted-foreground">{t('input.waktuSelesai')}</label>
                <Input id="input-waktu-selesai" type="time" value={waktuSelesai} onChange={(e) => setWaktuSelesai(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="input-lokasi" className="text-sm text-muted-foreground">{t('input.lokasiPenangkapan')}</label>
                <Input id="input-lokasi" value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder={t('input.lokasiPlaceholder')} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">{t('input.lanjut')}</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="p-2">{t('input.colJenisIkan')}</th>
                      <th className="p-2">{t('input.colBeratKg')}</th>
                      <th className="p-2">{t('input.colJumlahEkor')}</th>
                      <th className="p-2">{t('input.colKondisi')}</th>
                      <th className="p-2">{t('input.colAksi')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="p-2">
                          <Select value={row.nama} onValueChange={(v) => updateRow(i, { nama: v ?? row.nama })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {JENIS_IKAN_OPTIONS.map((nama) => (
                                <SelectItem key={nama} value={nama}>{nama}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input type="number" min={0} value={row.beratKg} onChange={(e) => updateRow(i, { beratKg: e.target.value })} />
                        </td>
                        <td className="p-2">
                          <Input type="number" min={0} value={row.jumlahEkor} onChange={(e) => updateRow(i, { jumlahEkor: e.target.value })} />
                        </td>
                        <td className="p-2">
                          <Select value={row.kondisi} onValueChange={(v) => updateRow(i, { kondisi: (v ?? row.kondisi) as JenisIkanTangkapan['kondisi'] })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {KONDISI_OPTIONS.map((k) => (
                                <SelectItem key={k} value={k}>{k}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Button type="button" variant="outline" size="sm" disabled={rows.length === 1} onClick={() => removeRow(i)}>{t('input.hapus')}</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="button" variant="outline" onClick={addRow}>{t('input.tambahJenisIkan')}</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>{t('input.kembali')}</Button>
                <Button type="button" onClick={handleNextFromStep2}>{t('input.lanjut')}</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-muted-foreground">{t('input.kapal')}</span><br /><span className="font-medium">{kapalTerpilih?.nama ?? '-'}</span></p>
                <p><span className="text-muted-foreground">{t('input.lokasi')}</span><br /><span className="font-medium">{lokasi}</span></p>
                <p><span className="text-muted-foreground">{t('input.tanggal')}</span><br /><span className="font-medium">{tanggal}</span></p>
                <p><span className="text-muted-foreground">{t('input.waktu')}</span><br /><span className="font-medium">{waktuMulai} - {waktuSelesai}</span></p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="p-2">{t('input.colJenisIkan')}</th>
                      <th className="p-2">{t('input.colBeratKg')}</th>
                      <th className="p-2">{t('input.colJumlahEkor')}</th>
                      <th className="p-2">{t('input.colKondisi')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="p-2">{row.nama}</td>
                        <td className="p-2">{formatNumber(Number(row.beratKg) || 0)}</td>
                        <td className="p-2">{formatNumber(Number(row.jumlahEkor) || 0)}</td>
                        <td className="p-2">{row.kondisi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span>{t('input.totalBerat')} <strong>{formatNumber(totalBerat)} kg</strong></span>
                <span>{t('input.estimasiNilai')} <strong>{formatRupiah(estimasiNilai)}</strong></span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>{t('input.kembali')}</Button>
                <Button type="button" onClick={handleSubmit}>{t('input.simpan')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
