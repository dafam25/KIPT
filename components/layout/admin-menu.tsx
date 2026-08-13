'use client';

import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toastManager } from '@/components/ui/toast';
import { useLanguage } from '@/lib/i18n/context';

export function AdminMenu() {
  const { t } = useLanguage();

  function showComingSoonToast() {
    toastManager.add({
      title: t('pengaturan.toastFiturBelumTersediaTitle'),
      description: t('pengaturan.toastFiturBelumTersediaDesc'),
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm outline-none data-[popup-open]:bg-muted">
        <span className="h-6 w-6 rounded-full bg-primary" />
        {t('layout.adminLabel')}
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-44">
        <DropdownMenuItem onClick={showComingSoonToast}>
          <User />
          {t('layout.menuProfil')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={showComingSoonToast}>
          <Settings />
          {t('layout.menuPengaturanAkun')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={showComingSoonToast}>
          <LogOut />
          {t('layout.menuKeluar')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
