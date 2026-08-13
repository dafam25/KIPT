'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/context';
import { navItems } from './nav-items';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground">
      <div className="mb-6 flex flex-col items-center gap-2 px-0.5 text-center">
        <img
          src="/images/kipt-nelayan-sejahtera.jpg"
          alt="Logo KIPT Nelayan Sejahtera"
          className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-white/25"
        />
        <div>
          <p className="text-sm font-bold tracking-wide">DIGITAL NELAYAN ID</p>
          <p className="text-xs text-sidebar-foreground/60">{t('layout.brandSubtitle')}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
