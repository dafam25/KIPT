'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useData } from '@/context/data-context';

export function NotificationBell() {
  const { notifikasi } = useData();
  const unread = notifikasi.filter((n) => !n.dibaca).length;

  return (
    <Link href="/notifikasi" className="relative rounded-full border border-border p-2 hover:bg-muted">
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
