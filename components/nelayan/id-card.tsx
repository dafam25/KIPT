import type { Nelayan } from '@/lib/types';
import { AVATAR_DEFAULT } from '@/lib/avatar';
import { useLanguage } from '@/lib/i18n/context';

export interface IdCardProps {
  nelayan: Nelayan;
  koperasiNama?: string;
  kapalNama?: string;
}

export function IdCard({ nelayan, koperasiNama, kapalNama }: IdCardProps) {
  const { t } = useLanguage();
  return (
    <div className="w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
        <span className="h-2 w-2 rounded-full bg-primary-foreground" />
        {t('idCard.header')}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <img
            src={nelayan.fotoUrl || AVATAR_DEFAULT}
            alt={nelayan.nama}
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
          <div>
            <p className="text-xs text-muted-foreground">{nelayan.id}</p>
            <p className="text-lg font-semibold text-foreground">{nelayan.nama}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p><span className="text-muted-foreground">{t('idCard.koperasi')}</span><br /><span className="text-foreground">{koperasiNama ?? '-'}</span></p>
          <p><span className="text-muted-foreground">{t('idCard.kapal')}</span><br /><span className="text-foreground">{kapalNama ?? '-'}</span></p>
          <p><span className="text-muted-foreground">{t('idCard.status')}</span><br /><span className="text-foreground">{nelayan.status === 'aktif' ? t('status.aktif') : t('status.nonaktif')}</span></p>
        </div>
      </div>
    </div>
  );
}
