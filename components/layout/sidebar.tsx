'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from './nav-items';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card px-3 py-4">
      <div className="mb-6 flex items-center gap-1.5 px-0.5">
        <Landmark className="h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-bold tracking-wide">DIGITAL FISHERMAN ID</p>
          <p className="text-xs text-muted-foreground">TRACKING KAPAL & HASIL TANGKAP</p>
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
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
