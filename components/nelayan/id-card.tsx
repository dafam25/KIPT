import type { Nelayan } from '@/lib/types';

export interface IdCardProps {
  nelayan: Nelayan;
  koperasiNama?: string;
  kapalNama?: string;
}

export function IdCard({ nelayan, koperasiNama, kapalNama }: IdCardProps) {
  return (
    <div className="w-80 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-5 text-white">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <span className="h-2 w-2 rounded-full bg-blue-400" />
        Nelayan ID
      </div>
      <div className="flex items-center gap-3">
        <img
          src={nelayan.fotoUrl || 'https://placehold.co/64x64?text=Foto'}
          alt={nelayan.nama}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <p className="text-xs text-slate-300">{nelayan.id}</p>
          <p className="text-lg font-semibold">{nelayan.nama}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <p><span className="text-slate-400">Koperasi</span><br />{koperasiNama ?? '-'}</p>
        <p><span className="text-slate-400">Kapal</span><br />{kapalNama ?? '-'}</p>
        <p><span className="text-slate-400">Status</span><br />{nelayan.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</p>
      </div>
    </div>
  );
}
