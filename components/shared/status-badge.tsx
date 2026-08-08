import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success/20 text-success border-success/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
  destructive: 'bg-destructive/20 text-destructive border-destructive/30',
  info: 'bg-primary/20 text-primary border-primary/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone])}>
      {label}
    </Badge>
  );
}
