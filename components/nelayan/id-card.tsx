import type { Nelayan } from '@/lib/types';

export interface IdCardProps {
  nelayan: Nelayan;
  koperasiNama?: string;
  kapalNama?: string;
}

export function IdCard({ nelayan, koperasiNama, kapalNama }: IdCardProps) {
  return (
    <div className="w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
        <span className="h-2 w-2 rounded-full bg-primary-foreground" />
        Nelayan ID
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <img
            src={nelayan.fotoUrl || '/avatars/default.svg'}
            alt={nelayan.nama}
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
          <div>
            <p className="text-xs text-muted-foreground">{nelayan.id}</p>
            <p className="text-lg font-semibold text-foreground">{nelayan.nama}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p><span className="text-muted-foreground">Koperasi</span><br /><span className="text-foreground">{koperasiNama ?? '-'}</span></p>
          <p><span className="text-muted-foreground">Kapal</span><br /><span className="text-foreground">{kapalNama ?? '-'}</span></p>
          <p><span className="text-muted-foreground">Status</span><br /><span className="text-foreground">{nelayan.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span></p>
        </div>
      </div>
    </div>
  );
}
