'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Users, CheckCircle2, ShieldCheck, UsersRound, Plus } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
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
import { avatarForGender, AVATAR_DEFAULT, type JenisKelamin } from '@/lib/avatar';

const NONE_VALUE = 'none';

function emptyForm() {
  return {
    nama: '', nik: '', tempatLahir: '', tanggalLahir: '', alamat: '', noHp: '', pendamping: '',
    jenisKelamin: 'pria' as JenisKelamin, koperasiId: NONE_VALUE, kapalId: NONE_VALUE,
  };
}

export default function NelayanListPage() {
  const { nelayan, koperasi, kapal, addNelayan } = useData();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');

  const JENIS_KELAMIN_OPTIONS: { value: JenisKelamin; label: string }[] = [
    { value: 'pria', label: t('nelayan.genderPria') },
    { value: 'wanita', label: t('nelayan.genderWanita') },
  ];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.nik.trim() || !form.tempatLahir.trim() || !form.tanggalLahir || !form.alamat.trim() || !form.noHp.trim() || !form.pendamping.trim()) {
      setError(t('nelayan.errorLengkapi'));
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
      fotoUrl: avatarForGender(form.jenisKelamin),
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
    { header: t('nelayan.colId'), cell: (n) => <span className="font-mono text-xs">{n.id}</span> },
    {
      header: t('nelayan.colNama'),
      cell: (n) => (
        <Link href={`/nelayan/${n.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
          <img
            src={n.fotoUrl || AVATAR_DEFAULT}
            alt={n.nama}
            className="h-6 w-6 shrink-0 rounded-full border border-border object-cover"
          />
          {n.nama}
        </Link>
      ),
    },
    {
      header: t('nelayan.colKoperasi'),
      cell: (n) => {
        const nama = koperasi.find((k) => k.id === n.koperasiId)?.nama ?? '-';
        return (
          <span className="block max-w-40 truncate" title={nama}>
            {nama}
          </span>
        );
      },
    },
    { header: t('nelayan.colKapal'), cell: (n) => kapal.find((k) => k.id === n.kapalId)?.nama ?? '-' },
    { header: t('nelayan.colBergabung'), cell: (n) => formatDate(n.tanggalBergabung) },
    {
      header: t('nelayan.colStatus'),
      cell: (n) => (
        <StatusBadge
          label={n.status === 'aktif' ? t('status.aktif') : t('status.nonaktif')}
          tone={n.status === 'aktif' ? 'success' : 'muted'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nelayan.listTitle') }]}
        title={t('nelayan.listTitle')}
        description={t('nelayan.listDescription')}
        actions={
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
              {t('nelayan.addButton')}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('nelayan.dialogTitle')}</DialogTitle>
                <DialogDescription>{t('nelayan.dialogDescription')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="nelayan-nama" className="text-sm text-muted-foreground">{t('nelayan.formNama')}</label>
                  <Input id="nelayan-nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-nik" className="text-sm text-muted-foreground">{t('nelayan.formNik')}</label>
                  <Input id="nelayan-nik" value={form.nik} onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-jenis-kelamin" className="text-sm text-muted-foreground">{t('nelayan.formJenisKelamin')}</label>
                  <Select
                    items={JENIS_KELAMIN_OPTIONS}
                    value={form.jenisKelamin}
                    onValueChange={(v) => setForm((f) => ({ ...f, jenisKelamin: (v ?? 'pria') as JenisKelamin }))}
                  >
                    <SelectTrigger id="nelayan-jenis-kelamin"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {JENIS_KELAMIN_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-no-hp" className="text-sm text-muted-foreground">{t('nelayan.formNoHp')}</label>
                  <Input id="nelayan-no-hp" value={form.noHp} onChange={(e) => setForm((f) => ({ ...f, noHp: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-tempat-lahir" className="text-sm text-muted-foreground">{t('nelayan.formTempatLahir')}</label>
                  <Input id="nelayan-tempat-lahir" value={form.tempatLahir} onChange={(e) => setForm((f) => ({ ...f, tempatLahir: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-tanggal-lahir" className="text-sm text-muted-foreground">{t('nelayan.formTanggalLahir')}</label>
                  <Input id="nelayan-tanggal-lahir" type="date" value={form.tanggalLahir} onChange={(e) => setForm((f) => ({ ...f, tanggalLahir: e.target.value }))} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="nelayan-alamat" className="text-sm text-muted-foreground">{t('nelayan.formAlamat')}</label>
                  <Input id="nelayan-alamat" value={form.alamat} onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-pendamping" className="text-sm text-muted-foreground">{t('nelayan.formPendamping')}</label>
                  <Input id="nelayan-pendamping" value={form.pendamping} onChange={(e) => setForm((f) => ({ ...f, pendamping: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-koperasi" className="text-sm text-muted-foreground">{t('nelayan.formKoperasi')}</label>
                  <Select
                    items={[{ value: NONE_VALUE, label: t('nelayan.tanpaKoperasi') }, ...koperasi.map((k) => ({ value: k.id, label: k.nama }))]}
                    value={form.koperasiId}
                    onValueChange={(v) => setForm((f) => ({ ...f, koperasiId: v ?? NONE_VALUE }))}
                  >
                    <SelectTrigger id="nelayan-koperasi"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>{t('nelayan.tanpaKoperasi')}</SelectItem>
                      {koperasi.map((k) => (
                        <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="nelayan-kapal" className="text-sm text-muted-foreground">{t('nelayan.formKapal')}</label>
                  <Select
                    items={[{ value: NONE_VALUE, label: t('nelayan.tanpaKapal') }, ...kapal.map((k) => ({ value: k.id, label: k.nama }))]}
                    value={form.kapalId}
                    onValueChange={(v) => setForm((f) => ({ ...f, kapalId: v ?? NONE_VALUE }))}
                  >
                    <SelectTrigger id="nelayan-kapal"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>{t('nelayan.tanpaKapal')}</SelectItem>
                      {kapal.map((k) => (
                        <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
                <DialogFooter className="sm:col-span-2">
                  <Button type="submit">{t('common.save')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label={t('nelayan.kpiTotalNelayan')} value={formatNumber(totalNelayan(nelayan))} deltaPercent={4.6} deltaLabel={t('common.comparedToLastMonth')} accent="blue" />
        <KpiCard icon={CheckCircle2} label={t('nelayan.kpiNelayanAktif')} value={formatNumber(nelayanAktifCount(nelayan))} deltaPercent={2.1} deltaLabel={t('common.comparedToLastMonth')} accent="green" />
        <KpiCard icon={ShieldCheck} label={t('nelayan.kpiTerverifikasi')} value={formatNumber(nelayanTerverifikasiCount(nelayan))} deltaPercent={3.8} deltaLabel={t('common.comparedToLastMonth')} accent="cyan" />
        <KpiCard icon={UsersRound} label={t('nelayan.kpiTergabungKoperasi')} value={formatNumber(nelayanTergabungKoperasiCount(nelayan))} deltaPercent={1.5} deltaLabel={t('common.comparedToLastMonth')} accent="purple" />
      </div>
      <DataTable
        data={nelayan}
        columns={columns}
        getRowKey={(n) => n.id}
        searchPlaceholder={t('nelayan.searchPlaceholder')}
        filterFn={(n, q) => n.nama.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)}
      />
    </div>
  );
}
