import type { KapalStatus } from './types';
import type { StatusTone } from '@/components/shared/status-badge';

export const KAPAL_STATUS_LABEL: Record<KapalStatus, string> = {
  melaut: 'Aktif Melaut',
  sandar: 'Sandar',
  tidak_aktif: 'Tidak Aktif',
  perbaikan: 'Perbaikan',
};

export const KAPAL_STATUS_LABEL_KEY: Record<KapalStatus, string> = {
  melaut: 'kapal.statusMelaut',
  sandar: 'kapal.statusSandar',
  tidak_aktif: 'kapal.statusTidakAktif',
  perbaikan: 'kapal.statusPerbaikan',
};

export const KAPAL_STATUS_TONE: Record<KapalStatus, StatusTone> = {
  melaut: 'success',
  sandar: 'warning',
  tidak_aktif: 'destructive',
  perbaikan: 'muted',
};
