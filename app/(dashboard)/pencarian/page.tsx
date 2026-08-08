'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { searchGlobal, type SearchResult } from '@/lib/search';

function PencarianResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { nelayan, kapal, hasilTangkap } = useData();
  const results = useMemo(() => searchGlobal(q, nelayan, kapal, hasilTangkap), [q, nelayan, kapal, hasilTangkap]);
  const emptyPrompt = 'Masukkan kata kunci pencarian di kolom pencarian atas';

  const columns: DataTableColumn<SearchResult>[] = [
    { header: 'Kategori', cell: (r) => r.kategori },
    {
      header: 'Nama / Judul',
      cell: (r) => (
        <Link href={r.href} className="font-medium text-primary hover:underline">
          {r.judul}
        </Link>
      ),
    },
    { header: 'ID', cell: (r) => <span className="font-mono text-xs">{r.subjudul}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pencarian' }]}
        title="Hasil Pencarian"
        description={q ? `Menampilkan hasil untuk "${q}"` : emptyPrompt}
      />
      <DataTable
        key={q}
        data={results}
        columns={columns}
        getRowKey={(r) => `${r.kategori}-${r.id}`}
        emptyMessage={q ? `Tidak ada hasil untuk "${q}"` : emptyPrompt}
      />
    </div>
  );
}

export default function PencarianPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat hasil pencarian...</p>}>
      <PencarianResults />
    </Suspense>
  );
}
