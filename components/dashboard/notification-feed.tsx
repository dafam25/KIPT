'use client';

import { AlertTriangle, Info, CheckCircle2, Settings as SettingsIcon } from 'lucide-react';
import { useData } from '@/context/data-context';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NotifikasiJenis } from '@/lib/types';

const ICONS: Record<NotifikasiJenis, typeof AlertTriangle> = {
  peringatan: AlertTriangle,
  informasi: Info,
  sukses: CheckCircle2,
  sistem: SettingsIcon,
};

const STYLES: Record<NotifikasiJenis, string> = {
  peringatan: 'text-destructive bg-destructive/10',
  informasi: 'text-primary bg-primary/10',
  sukses: 'text-success bg-success/10',
  sistem: 'text-accent bg-accent/10',
};

export function NotificationFeed({ limit = 5 }: { limit?: number }) {
  const { notifikasi, markNotifikasiDibaca } = useData();
  const items = [...notifikasi]
    .sort((a, b) => b.waktu.localeCompare(a.waktu))
    .slice(0, limit);

  return (
    <div className="space-y-2">
      {items.map((n) => {
        const Icon = ICONS[n.jenis];
        return (
          <Card key={n.id} onClick={() => markNotifikasiDibaca(n.id)} className="cursor-pointer">
            <CardContent className="flex gap-3 p-3">
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', STYLES[n.jenis])}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className={cn('truncate text-sm font-medium', !n.dibaca && 'text-foreground', n.dibaca && 'text-muted-foreground')}>
                  {n.judul}
                </p>
                <p className="truncate text-xs text-muted-foreground">{n.deskripsi}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
