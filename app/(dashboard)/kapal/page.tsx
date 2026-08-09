'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Ship, Anchor, PauseCircle, AlertTriangle, Plus } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { Kapal } from '@/lib/types';
import { totalKapal, kapalMelautCount, kapalSandarCount, kapalTidakAktifCount } from '@/lib/stats';
import { formatNumber } from '@/lib/format';
import { KAPAL_STATUS_LABEL, KAPAL_STATUS_TONE } from '@/lib/kapal-status';
import { nextKapalId } from '@/lib/id';

const JENIS_KAPAL_OPTIONS: Kapal['jenis'][] = ['Purse Seine', 'Longline', 'Gillnet', 'Kapal Motor', 'Kapal Tanpa Motor'];
const NONE_NAHKODA = 'none';

function emptyForm() {
  return {
    nama: '', jenis: JENIS_KAPAL_OPTIONS[0] as Kapal['jenis'], gt: '', mesinPk: '', kecepatanKnot: '',
    pelabuhanInduk: '', nahkodaId: NONE_NAHKODA, slo: false, pasKecil: false,
  };
}

export default function KapalListPage() {
  const { kapal, nelayan, addKapal } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.pelabuhanInduk.trim() || !form.gt || !form.mesinPk || !form.kecepatanKnot) {
      setError('Lengkapi semua data kapal terlebih dahulu.');
      return;
    }
    addKapal({
      id: nextKapalId(kapal.map((k) => k.id)),
      nama: form.nama.trim(),
      jenis: form.jenis,
      gt: Number(form.gt) || 0,
      mesinPk: Number(form.mesinPk) || 0,
      kecepatanKnot: Number(form.kecepatanKnot) || 0,
      pelabuhanInduk: form.pelabuhanInduk.trim(),
      status: 'sandar',
      posisi: { lat: -6.2, lng: 106.8 },
      dokumen: { siup: true, slo: form.slo, pasKecil: form.pasKecil },
      nahkodaId: form.nahkodaId === NONE_NAHKODA ? null : form.nahkodaId,
    });
    setForm(emptyForm());
    setError('');
    setOpen(false);
  }

  const columns: DataTableColumn<Kapal>[] = [
    {
      header: 'Nama Kapal',
      cell: (k) => (
        <Link href={`/kapal/${k.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Ship className="h-3.5 w-3.5" />
          </span>
          {k.nama}
        </Link>
      ),
    },
    { header: 'ID Kapal', cell: (k) => <span className="font-mono text-xs">{k.id}</span> },
    { header: 'Jenis', cell: (k) => k.jenis },
    { header: 'GT', cell: (k) => `${k.gt} GT` },
    { header: 'Pelabuhan Induk', cell: (k) => k.pelabuhanInduk },
    { header: 'Nahkoda', cell: (k) => nelayan.find((n) => n.id === k.nahkodaId)?.nama ?? '-' },
    { header: 'Status', cell: (k) => <StatusBadge label={KAPAL_STATUS_LABEL[k.status]} tone={KAPAL_STATUS_TONE[k.status]} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Kapal' }]}
        title="Kapal"
        description="Kelola data kapal terdaftar"
        actions={
          <>
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) {
                  setForm(emptyForm());
                  setError('');
                }
              }}
            >
              <DialogTrigger render={<Button />}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kapal
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Tambah Kapal</DialogTitle>
                  <DialogDescription>Daftarkan kapal baru ke sistem Digital Fisherman ID.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="kapal-nama" className="text-sm text-muted-foreground">Nama Kapal</label>
                    <Input id="kapal-nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-jenis" className="text-sm text-muted-foreground">Jenis Kapal</label>
                    <Select
                      items={JENIS_KAPAL_OPTIONS.map((j) => ({ value: j, label: j }))}
                      value={form.jenis}
                      onValueChange={(v) => setForm((f) => ({ ...f, jenis: (v ?? f.jenis) as Kapal['jenis'] }))}
                    >
                      <SelectTrigger id="kapal-jenis"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {JENIS_KAPAL_OPTIONS.map((j) => (
                          <SelectItem key={j} value={j}>{j}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-pelabuhan" className="text-sm text-muted-foreground">Pelabuhan Induk</label>
                    <Input id="kapal-pelabuhan" value={form.pelabuhanInduk} onChange={(e) => setForm((f) => ({ ...f, pelabuhanInduk: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-gt" className="text-sm text-muted-foreground">GT</label>
                    <Input id="kapal-gt" type="number" min={0} value={form.gt} onChange={(e) => setForm((f) => ({ ...f, gt: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-mesin" className="text-sm text-muted-foreground">Mesin (PK)</label>
                    <Input id="kapal-mesin" type="number" min={0} value={form.mesinPk} onChange={(e) => setForm((f) => ({ ...f, mesinPk: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-kecepatan" className="text-sm text-muted-foreground">Kecepatan (Knot)</label>
                    <Input id="kapal-kecepatan" type="number" min={0} value={form.kecepatanKnot} onChange={(e) => setForm((f) => ({ ...f, kecepatanKnot: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="kapal-nahkoda" className="text-sm text-muted-foreground">Nahkoda</label>
                    <Select
                      items={[{ value: NONE_NAHKODA, label: 'Tanpa Nahkoda' }, ...nelayan.map((n) => ({ value: n.id, label: n.nama }))]}
                      value={form.nahkodaId}
                      onValueChange={(v) => setForm((f) => ({ ...f, nahkodaId: v ?? NONE_NAHKODA }))}
                    >
                      <SelectTrigger id="kapal-nahkoda"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_NAHKODA}>Tanpa Nahkoda</SelectItem>
                        {nelayan.map((n) => (
                          <SelectItem key={n.id} value={n.id}>{n.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between sm:col-span-2">
                    <label htmlFor="kapal-slo" className="text-sm text-muted-foreground">SLO Tersedia</label>
                    <Switch id="kapal-slo" checked={form.slo} onCheckedChange={(v) => setForm((f) => ({ ...f, slo: v }))} />
                  </div>
                  <div className="flex items-center justify-between sm:col-span-2">
                    <label htmlFor="kapal-pas-kecil" className="text-sm text-muted-foreground">Pas Kecil Tersedia</label>
                    <Switch id="kapal-pas-kecil" checked={form.pasKecil} onCheckedChange={(v) => setForm((f) => ({ ...f, pasKecil: v }))} />
                  </div>
                  {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
                  <DialogFooter className="sm:col-span-2">
                    <Button type="submit">Simpan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" render={<Link href="/kapal/jadwal-sandar" />}>
              Jadwal Sandar
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Ship} label="Total Kapal" value={formatNumber(totalKapal(kapal))} deltaPercent={5.2} deltaLabel="Dibandingkan bulan lalu" accent="blue" />
        <KpiCard icon={Anchor} label="Aktif Melaut" value={formatNumber(kapalMelautCount(kapal))} deltaPercent={3.4} deltaLabel="Dibandingkan bulan lalu" accent="green" />
        <KpiCard icon={PauseCircle} label="Sandar" value={formatNumber(kapalSandarCount(kapal))} deltaPercent={-1.8} deltaLabel="Dibandingkan bulan lalu" accent="cyan" />
        <KpiCard icon={AlertTriangle} label="Tidak Aktif" value={formatNumber(kapalTidakAktifCount(kapal))} deltaPercent={-2.6} deltaLabel="Dibandingkan bulan lalu" accent="purple" />
      </div>
      <DataTable
        data={kapal}
        columns={columns}
        getRowKey={(k) => k.id}
        searchPlaceholder="Cari nama atau ID kapal..."
        filterFn={(k, q) => k.nama.toLowerCase().includes(q) || k.id.toLowerCase().includes(q)}
      />
    </div>
  );
}
