'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Users, CheckCircle2, ShieldCheck, UsersRound } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { Nelayan } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/format';
import { totalNelayan, nelayanAktifCount, nelayanTerverifikasiCount, nelayanTergabungKoperasiCount } from '@/lib/stats';
import { nextNelayanId } from '@/lib/id';

const NONE_VALUE = 'none';

function emptyForm() {
  return {
    nama: '', nik: '', tempatLahir: '', tanggalLahir: '', alamat: '', noHp: '', pendamping: '',
    koperasiId: NONE_VALUE, kapalId: NONE_VALUE,
  };
}

export default function NelayanListPage() {
  const { nelayan, koperasi, kapal, addNelayan } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.nik.trim() || !form.tempatLahir.trim() || !form.tanggalLahir || !form.alamat.trim() || !form.noHp.trim() || !form.pendamping.trim()) {
      setError('Lengkapi semua data nelayan terlebih dahulu.');
      return;
    }
    addNelayan({
      id: nextNelayanId(nelayan.map((n) => n.id)),
      nama: form.nama.trim(),
      nik: form.nik.trim(),
      tempatLahir: form.tempatLahir.trim(),
      tanggalLahir: form.tanggalLahir,
      alamat: form.alamat.trim(),
      noHp: form.noHp.trim(),
      fotoUrl: '',
      status: 'aktif',
      terverifikasi: false,
      tanggalBergabung: new Date().toISOString().slice(0, 10),
      koperasiId: form.koperasiId === NONE_VALUE ? null : form.koperasiId,
      kapalId: form.kapalId === NONE_VALUE ? null : form.kapalId,
      pendamping: form.pendamping.trim(),
    });
    setForm(emptyForm());
    setError('');
    setOpen(false);
  }

  const columns: DataTableColumn<Nelayan>[] = [
    { header: 'ID', cell: (n) => <span className="font-mono text-xs">{n.id}</span> },
    {
      header: 'Nama',
      cell: (n) => (
        <Link href={`/nelayan/${n.id}`} className="font-medium text-primary hover:underline">
          {n.nama}
        </Link>
      ),
    },
    { header: 'Koperasi', cell: (n) => koperasi.find((k) => k.id === n.koperasiId)?.nama ?? '-' },
    { header: 'Kapal', cell: (n) => kapal.find((k) => k.id === n.kapalId)?.nama ?? '-' },
    { header: 'Bergabung', cell: (n) => formatDate(n.tanggalBergabung) },
    {
      header: 'Status',
      cell: (n) => (
        <StatusBadge
          label={n.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
          tone={n.status === 'aktif' ? 'success' : 'muted'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Nelayan' }]}
        title="Nelayan"
        description="Kelola data nelayan terdaftar"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>Tambah Nelayan</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Nelayan</DialogTitle>
                <DialogDescription>Daftarkan nelayan baru ke sistem Digital Fisherman ID.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="nelayan-nama" className="text-sm text-muted-foreground">Nama</label>
                  <Input id="nelayan-nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-nik" className="text-sm text-muted-foreground">NIK</label>
                  <Input id="nelayan-nik" value={form.nik} onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-no-hp" className="text-sm text-muted-foreground">No HP</label>
                  <Input id="nelayan-no-hp" value={form.noHp} onChange={(e) => setForm((f) => ({ ...f, noHp: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-tempat-lahir" className="text-sm text-muted-foreground">Tempat Lahir</label>
                  <Input id="nelayan-tempat-lahir" value={form.tempatLahir} onChange={(e) => setForm((f) => ({ ...f, tempatLahir: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-tanggal-lahir" className="text-sm text-muted-foreground">Tanggal Lahir</label>
                  <Input id="nelayan-tanggal-lahir" type="date" value={form.tanggalLahir} onChange={(e) => setForm((f) => ({ ...f, tanggalLahir: e.target.value }))} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="nelayan-alamat" className="text-sm text-muted-foreground">Alamat</label>
                  <Input id="nelayan-alamat" value={form.alamat} onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-pendamping" className="text-sm text-muted-foreground">Pendamping</label>
                  <Input id="nelayan-pendamping" value={form.pendamping} onChange={(e) => setForm((f) => ({ ...f, pendamping: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-koperasi" className="text-sm text-muted-foreground">Koperasi</label>
                  <Select
                    items={[{ value: NONE_VALUE, label: 'Tanpa Koperasi' }, ...koperasi.map((k) => ({ value: k.id, label: k.nama }))]}
                    value={form.koperasiId}
                    onValueChange={(v) => setForm((f) => ({ ...f, koperasiId: v ?? NONE_VALUE }))}
                  >
                    <SelectTrigger id="nelayan-koperasi"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Tanpa Koperasi</SelectItem>
                      {koperasi.map((k) => (
                        <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="nelayan-kapal" className="text-sm text-muted-foreground">Kapal</label>
                  <Select
                    items={[{ value: NONE_VALUE, label: 'Tanpa Kapal' }, ...kapal.map((k) => ({ value: k.id, label: k.nama }))]}
                    value={form.kapalId}
                    onValueChange={(v) => setForm((f) => ({ ...f, kapalId: v ?? NONE_VALUE }))}
                  >
                    <SelectTrigger id="nelayan-kapal"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Tanpa Kapal</SelectItem>
                      {kapal.map((k) => (
                        <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
                <DialogFooter className="sm:col-span-2">
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Total Nelayan" value={formatNumber(totalNelayan(nelayan))} accent="blue" />
        <KpiCard icon={CheckCircle2} label="Nelayan Aktif" value={formatNumber(nelayanAktifCount(nelayan))} accent="green" />
        <KpiCard icon={ShieldCheck} label="Terverifikasi" value={formatNumber(nelayanTerverifikasiCount(nelayan))} accent="cyan" />
        <KpiCard icon={UsersRound} label="Tergabung Koperasi" value={formatNumber(nelayanTergabungKoperasiCount(nelayan))} accent="purple" />
      </div>
      <DataTable
        data={nelayan}
        columns={columns}
        getRowKey={(n) => n.id}
        searchPlaceholder="Cari nama atau ID nelayan..."
        filterFn={(n, q) => n.nama.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)}
      />
    </div>
  );
}
