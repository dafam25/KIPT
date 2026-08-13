'use client';

import { useState, type FormEvent } from 'react';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { JadwalSandar } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { generateLocalId } from '@/lib/id';

const DERMAGA_OPTIONS = ['Dermaga 01', 'Dermaga 02', 'Dermaga 03'];
const PRIORITAS_OPTIONS: JadwalSandar['prioritas'][] = ['Rendah', 'Normal', 'Tinggi'];

export default function JadwalSandarPage() {
  const { kapal, jadwalSandar, addJadwalSandar } = useData();
  const { t } = useLanguage();

  const [kapalId, setKapalId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktuTiba, setWaktuTiba] = useState('');
  const [durasiJam, setDurasiJam] = useState('4');
  const [dermaga, setDermaga] = useState(DERMAGA_OPTIONS[0]);
  const [prioritas, setPrioritas] = useState<JadwalSandar['prioritas']>('Normal');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!kapalId || !tanggal || !waktuTiba) {
      setError(t('jadwalSandar.errorPilih'));
      return;
    }
    setError('');
    addJadwalSandar({
      id: generateLocalId('JS'),
      kapalId,
      tanggal,
      dermaga,
      waktuTiba,
      durasiJam: Number(durasiJam) || 1,
      prioritas,
    });
    setKapalId('');
    setTanggal('');
    setWaktuTiba('');
    setDurasiJam('4');
    setDermaga(DERMAGA_OPTIONS[0]);
    setPrioritas('Normal');
  }

  const columns: DataTableColumn<JadwalSandar>[] = [
    { header: t('jadwalSandar.colKapal'), cell: (j) => kapal.find((k) => k.id === j.kapalId)?.nama ?? j.kapalId },
    { header: t('jadwalSandar.colDermaga'), cell: (j) => j.dermaga },
    { header: t('jadwalSandar.colTanggal'), cell: (j) => formatDate(j.tanggal) },
    { header: t('jadwalSandar.colWaktuTiba'), cell: (j) => j.waktuTiba },
    { header: t('jadwalSandar.colDurasi'), cell: (j) => `${j.durasiJam} ${t('jadwalSandar.jam')}` },
    { header: t('jadwalSandar.colPrioritas'), cell: (j) => j.prioritas },
  ];

  const sortedJadwal = [...jadwalSandar].sort(
    (a, b) => a.tanggal.localeCompare(b.tanggal) || a.waktuTiba.localeCompare(b.waktuTiba)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('kapal.listTitle'), href: '/kapal' }, { label: t('jadwalSandar.title') }]}
        title={t('jadwalSandar.title')}
        description={t('jadwalSandar.description')}
      />

      <Card>
        <CardHeader className="text-sm font-semibold">{t('jadwalSandar.tambahJadwal')}</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="jadwal-kapal" className="text-sm text-muted-foreground">{t('jadwalSandar.pilihKapal')}</label>
              <Select
                items={kapal.map((k) => ({ value: k.id, label: k.nama }))}
                value={kapalId}
                onValueChange={(v) => setKapalId(v ?? '')}
              >
                <SelectTrigger id="jadwal-kapal"><SelectValue placeholder={t('jadwalSandar.placeholderPilihKapal')} /></SelectTrigger>
                <SelectContent>
                  {kapal.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-tanggal" className="text-sm text-muted-foreground">{t('jadwalSandar.tanggalSandar')}</label>
              <Input id="jadwal-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-waktu-tiba" className="text-sm text-muted-foreground">{t('jadwalSandar.waktuTibaEta')}</label>
              <Input id="jadwal-waktu-tiba" type="time" value={waktuTiba} onChange={(e) => setWaktuTiba(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-durasi" className="text-sm text-muted-foreground">{t('jadwalSandar.durasiSandarJam')}</label>
              <Input id="jadwal-durasi" type="number" min={1} max={24} value={durasiJam} onChange={(e) => setDurasiJam(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-dermaga" className="text-sm text-muted-foreground">{t('jadwalSandar.pilihDermaga')}</label>
              <Select value={dermaga} onValueChange={(v) => setDermaga(v ?? DERMAGA_OPTIONS[0])}>
                <SelectTrigger id="jadwal-dermaga"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DERMAGA_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-prioritas" className="text-sm text-muted-foreground">{t('jadwalSandar.prioritasSandar')}</label>
              <Select value={prioritas} onValueChange={(v) => setPrioritas((v ?? 'Normal') as JadwalSandar['prioritas'])}>
                <SelectTrigger id="jadwal-prioritas"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITAS_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-2 lg:col-span-3">{error}</p>}
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">{t('jadwalSandar.simpanJadwal')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">{t('jadwalSandar.daftarJadwal')}</CardHeader>
        <CardContent>
          <DataTable data={sortedJadwal} columns={columns} getRowKey={(j) => j.id} pageSize={10} />
        </CardContent>
      </Card>
    </div>
  );
}
