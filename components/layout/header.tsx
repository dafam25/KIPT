'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { NotificationBell } from './notification-bell';
import { navItems } from './nav-items';
import Link from 'next/link';

export function Header() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/pencarian?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="flex items-center gap-4 border-b border-border bg-card px-4 py-3">
      <Sheet>
        <SheetTrigger className="md:hidden rounded-md border border-border p-2">
          <Menu className="h-4 w-4" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-4 text-sidebar-foreground">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <img
              src="/images/kipt-nelayan-sejahtera.jpg"
              alt="Logo KIPT Nelayan Sejahtera"
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-white/25"
            />
            <div>
              <p className="text-sm font-bold tracking-wide">DIGITAL NELAYAN ID</p>
              <p className="text-xs text-sidebar-foreground/60">TRACKING KAPAL & HASIL TANGKAP</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nelayan, kapal, atau hasil..."
            className="pl-9"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
          <span className="h-6 w-6 rounded-full bg-primary" />
          Admin DKP
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>
    </header>
  );
}
