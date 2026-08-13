'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Database, Wrench, AlertTriangle, FileText, Search, HelpCircle, Ticket, ShieldCheck, Mail, Phone, Clock, ChevronRight } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toastManager } from '@/components/ui/toast';
import type { TiketBantuan, TiketKategori, TiketStatus } from '@/lib/types';
import { generateLocalId } from '@/lib/id';
import { formatDate, formatNumber } from '@/lib/format';
import { id as idDict } from '@/lib/i18n/id';
import { en as enDict } from '@/lib/i18n/en';

type FaqKategori = 'Akun & Akses' | 'Data & Informasi' | 'Fitur & Layanan' | 'Teknis & Error' | 'Kebijakan & Regulasi';

const STATUS_TONE: Record<TiketStatus, 'warning' | 'info' | 'success'> = {
  Terbuka: 'warning',
  Diproses: 'info',
  Selesai: 'success',
};

export default function BantuanPage() {
  const { tiketBantuan, addTiketBantuan } = useData();
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<FaqKategori | null>(null);

  const FAQ_ITEMS: { pertanyaan: string; jawaban: string; kategori: FaqKategori }[] =
    (language === 'id' ? idDict : enDict).bantuan.faq as { pertanyaan: string; jawaban: string; kategori: FaqKategori }[];

  const KATEGORI_BANTUAN: { value: FaqKategori; label: string; icon: typeof User }[] = [
    { value: 'Akun & Akses', label: t('bantuan.kategoriAkunAkses'), icon: User },
    { value: 'Data & Informasi', label: t('bantuan.kategoriDataInformasi'), icon: Database },
    { value: 'Fitur & Layanan', label: t('bantuan.kategoriFiturLayanan'), icon: Wrench },
    { value: 'Teknis & Error', label: t('bantuan.kategoriTeknisError'), icon: AlertTriangle },
    { value: 'Kebijakan & Regulasi', label: t('bantuan.kategoriKebijakanRegulasi'), icon: FileText },
  ];

  const KATEGORI_OPTIONS: TiketKategori[] = ['Teknis', 'Akun', 'Data', 'Lainnya'];
  const KATEGORI_LABEL: Record<TiketKategori, string> = {
    Teknis: t('bantuan.kategoriTeknis'),
    Akun: t('bantuan.kategoriAkun'),
    Data: t('bantuan.kategoriData'),
    Lainnya: t('bantuan.kategoriLainnya'),
  };
  const STATUS_LABEL: Record<TiketStatus, string> = {
    Terbuka: t('status.terbuka'),
    Diproses: t('status.diproses'),
    Selesai: t('status.selesai'),
  };

  const faqTersaring = FAQ_ITEMS.filter(
    (item) =>
      (!kategoriFilter || item.kategori === kategoriFilter) &&
      (search.trim() === '' ||
        item.pertanyaan.toLowerCase().includes(search.toLowerCase()) ||
        item.jawaban.toLowerCase().includes(search.toLowerCase())),
  );
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<TiketKategori>('Teknis');
  const [deskripsi, setDeskripsi] = useState('');
  const [error, setError] = useState('');

  const tiketUrut = [...tiketBantuan].sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada));

  const columns: DataTableColumn<TiketBantuan>[] = [
    { header: t('bantuan.colJudul'), cell: (row) => row.judul },
    { header: t('bantuan.colKategori'), cell: (row) => KATEGORI_LABEL[row.kategori] },
    { header: t('bantuan.colStatus'), cell: (row) => <StatusBadge label={STATUS_LABEL[row.status]} tone={STATUS_TONE[row.status]} /> },
    { header: t('bantuan.colTanggalDibuat'), cell: (row) => formatDate(row.dibuatPada.slice(0, 10)) },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim()) {
      setError(t('bantuan.errorJudulDeskripsi'));
      return;
    }
    addTiketBantuan({
      id: generateLocalId('TIK'),
      judul: judul.trim(),
      kategori,
      deskripsi: deskripsi.trim(),
      status: 'Terbuka',
      dibuatPada: new Date().toISOString(),
    });
    setJudul('');
    setKategori('Teknis');
    setDeskripsi('');
    setError('');
    toastManager.add({ title: t('bantuan.toastTiketBerhasilTitle'), description: t('bantuan.toastTiketBerhasilDesc') });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('bantuan.title') }]}
        title={t('bantuan.title')}
        description={t('bantuan.description')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={HelpCircle} label={t('bantuan.kpiJamLayanan')} value={t('bantuan.jamLayananValue')} accent="blue" />
        <KpiCard icon={HelpCircle} label={t('bantuan.kpiFaqTersedia')} value={formatNumber(FAQ_ITEMS.length)} accent="green" />
        <KpiCard icon={Ticket} label={t('bantuan.kpiTiketSaya')} value={formatNumber(tiketBantuan.length)} accent="cyan" />
        <KpiCard icon={ShieldCheck} label={t('bantuan.kpiStatusLayanan')} value={t('bantuan.statusLayananValue')} accent="purple" />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('bantuan.searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {KATEGORI_BANTUAN.map((kat) => {
              const Icon = kat.icon;
              const active = kategoriFilter === kat.value;
              return (
                <button
                  key={kat.value}
                  type="button"
                  onClick={() => setKategoriFilter(active ? null : kat.value)}
                  className={
                    active
                      ? 'flex flex-col items-center gap-2 rounded-lg border border-primary bg-primary/10 p-4 text-center'
                      : 'flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center hover:bg-muted/40'
                  }
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">{kat.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">
          {t('bantuan.pertanyaanSeringDiajukan')}
          {kategoriFilter && (
            <span className="ml-2 font-normal text-muted-foreground">
              — {KATEGORI_BANTUAN.find((k) => k.value === kategoriFilter)?.label}
            </span>
          )}
        </CardHeader>
        <CardContent>
          {faqTersaring.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('bantuan.tidakAdaFaqCocok')}</p>
          ) : (
            <Accordion>
              {faqTersaring.map((item) => (
                <AccordionItem key={item.pertanyaan} value={item.pertanyaan}>
                  <AccordionTrigger>{item.pertanyaan}</AccordionTrigger>
                  <AccordionContent>{item.jawaban}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
      <Card>
        <CardHeader className="text-sm font-semibold">{t('bantuan.tiketDukungan', { count: tiketBantuan.length })}</CardHeader>
        <CardContent>
          <DataTable data={tiketUrut} columns={columns} getRowKey={(row) => row.id} pageSize={10} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">{t('bantuan.ajukanTiketBaru')}</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="tiket-judul" className="text-sm text-muted-foreground">{t('bantuan.formJudul')}</label>
              <Input id="tiket-judul" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder={t('bantuan.judulPlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tiket-kategori" className="text-sm text-muted-foreground">{t('bantuan.formKategori')}</label>
              <Select
                items={KATEGORI_OPTIONS.map((k) => ({ value: k, label: KATEGORI_LABEL[k] }))}
                value={kategori}
                onValueChange={(v) => setKategori((v ?? 'Teknis') as TiketKategori)}
              >
                <SelectTrigger id="tiket-kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {KATEGORI_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="tiket-deskripsi" className="text-sm text-muted-foreground">{t('bantuan.formDeskripsi')}</label>
              <Textarea
                id="tiket-deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder={t('bantuan.deskripsiPlaceholder')}
              />
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit">{t('bantuan.ajukanTiket')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="text-sm font-semibold">{t('bantuan.hubungiKami')}</CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('bantuan.email')}</p>
                <p className="text-muted-foreground">bantuan@dkp.go.id</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('bantuan.telepon')}</p>
                <p className="text-muted-foreground">(021) 1234 5678</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('bantuan.jamOperasional')}</p>
                <p className="text-muted-foreground">{t('bantuan.jamOperasionalValue')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-sm font-semibold">{t('bantuan.panduanCepat')}</CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: t('bantuan.guideMelacakKapal'), href: '/peta-tracking' },
              { label: t('bantuan.guideInputHasilTangkapan'), href: '/hasil-tangkap/input' },
              { label: t('bantuan.guideCekBiosecurity'), href: '/hasil-tangkap/biosecurity' },
              { label: t('bantuan.guideMembuatLaporan'), href: '/laporan' },
              { label: t('bantuan.guideKelolaDataNelayan'), href: '/nelayan' },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted/40"
              >
                {guide.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
