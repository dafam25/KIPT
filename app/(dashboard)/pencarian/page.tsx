'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { useLanguage } from '@/lib/i18n/context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { searchGlobal, type SearchResult } from '@/lib/search';

function PencarianResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { nelayan, kapal, hasilTangkap } = useData();
  const { t } = useLanguage();
  const results = useMemo(() => searchGlobal(q, nelayan, kapal, hasilTangkap), [q, nelayan, kapal, hasilTangkap]);
  const emptyPrompt = t('pencarian.emptyPrompt');

  const columns: DataTableColumn<SearchResult>[] = [
    { header: t('pencarian.colKategori'), cell: (r) => r.kategori },
    {
      header: t('pencarian.colNamaJudul'),
      cell: (r) => (
        <Link href={r.href} className="font-medium text-primary hover:underline">
          {r.judul}
        </Link>
      ),
    },
    { header: t('pencarian.colId'), cell: (r) => <span className="font-mono text-xs">{r.subjudul}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('pencarian.title') }]}
        title={t('pencarian.title')}
        description={q ? t('pencarian.descriptionWithQuery', { q }) : emptyPrompt}
      />
      <DataTable
        key={q}
        data={results}
        columns={columns}
        getRowKey={(r) => `${r.kategori}-${r.id}`}
        emptyMessage={q ? t('pencarian.emptyMessageWithQuery', { q }) : emptyPrompt}
      />
    </div>
  );
}

export default function PencarianPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">{t('pencarian.memuatHasil')}</p>}>
      <PencarianResults />
    </Suspense>
  );
}
