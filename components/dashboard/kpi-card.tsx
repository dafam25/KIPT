import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatPercent } from '@/lib/format';

const ACCENT_BG: Record<string, string> = {
  blue: 'bg-primary text-primary-foreground',
  green: 'bg-success text-success-foreground',
  purple: 'bg-accent text-accent-foreground',
  cyan: 'bg-sky-500 text-white',
};

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  deltaPercent?: number;
  deltaLabel?: string;
  accent?: keyof typeof ACCENT_BG;
}

export function KpiCard({ icon: Icon, label, value, deltaPercent, deltaLabel, accent = 'blue' }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', ACCENT_BG[accent])}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">
            {value}
            {deltaPercent !== undefined && (
              <span className={cn('ml-2 text-xs', deltaPercent >= 0 ? 'text-success' : 'text-destructive')}>
                {deltaPercent >= 0 ? '↑' : '↓'} {formatPercent(Math.abs(deltaPercent))}
              </span>
            )}
          </p>
          {deltaLabel && <p className="text-xs text-muted-foreground">{deltaLabel}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
