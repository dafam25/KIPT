'use client';

import { useState, type FormEvent } from 'react';
import { useData } from '@/context/data-context';
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
      setError('Pilih kapal, tanggal, dan waktu tiba terlebih dahulu.');
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
    { header: 'Kapal', cell: (j) => kapal.find((k) => k.id === j.kapalId)?.nama ?? j.kapalId },
    { header: 'Dermaga', cell: (j) => j.dermaga },
    { header: 'Tanggal', cell: (j) => formatDate(j.tanggal) },
    { header: 'Waktu Tiba', cell: (j) => j.waktuTiba },
    { header: 'Durasi', cell: (j) => `${j.durasiJam} jam` },
    { header: 'Prioritas', cell: (j) => j.prioritas },
  ];

  const sortedJadwal = [...jadwalSandar].sort(
    (a, b) => a.tanggal.localeCompare(b.tanggal) || a.waktuTiba.localeCompare(b.waktuTiba)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Kapal', href: '/kapal' }, { label: 'Jadwal Sandar' }]}
        title="Jadwal Sandar"
        description="Kelola dan atur jadwal sandar kapal di pelabuhan"
      />

      <Card>
        <CardHeader className="text-sm font-semibold">Tambah Jadwal Sandar</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="jadwal-kapal" className="text-sm text-muted-foreground">Pilih Kapal</label>
              <Select
                items={kapal.map((k) => ({ value: k.id, label: k.nama }))}
                value={kapalId}
                onValueChange={(v) => setKapalId(v ?? '')}
              >
                <SelectTrigger id="jadwal-kapal"><SelectValue placeholder="Pilih kapal" /></SelectTrigger>
                <SelectContent>
                  {kapal.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-tanggal" className="text-sm text-muted-foreground">Tanggal Sandar</label>
              <Input id="jadwal-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-waktu-tiba" className="text-sm text-muted-foreground">Waktu Tiba (ETA)</label>
              <Input id="jadwal-waktu-tiba" type="time" value={waktuTiba} onChange={(e) => setWaktuTiba(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-durasi" className="text-sm text-muted-foreground">Durasi Sandar (Jam)</label>
              <Input id="jadwal-durasi" type="number" min={1} max={24} value={durasiJam} onChange={(e) => setDurasiJam(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-dermaga" className="text-sm text-muted-foreground">Pilih Dermaga</label>
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
              <label htmlFor="jadwal-prioritas" className="text-sm text-muted-foreground">Prioritas Sandar</label>
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
              <Button type="submit">Simpan Jadwal</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">Daftar Jadwal Sandar</CardHeader>
        <CardContent>
          <DataTable data={sortedJadwal} columns={columns} getRowKey={(j) => j.id} pageSize={10} />
        </CardContent>
      </Card>
    </div>
  );
}
