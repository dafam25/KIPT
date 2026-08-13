'use client';

import { useLanguage, type Language } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

const OPTIONS: { value: Language; code: string }[] = [
  { value: 'id', code: 'ID' },
  { value: 'en', code: 'EN' },
];

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center overflow-hidden rounded-full border border-border text-xs">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLanguage(opt.value)}
          aria-pressed={language === opt.value}
          aria-label={opt.value === 'id' ? t('langToggle.indonesian') : t('langToggle.english')}
          className={cn(
            'px-2.5 py-1.5 transition-colors',
            language === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {opt.code}
        </button>
      ))}
    </div>
  );
}
