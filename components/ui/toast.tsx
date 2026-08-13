'use client';

import { Toast } from '@base-ui/react/toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/context';

export const toastManager = Toast.createToastManager();

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <ToastList />
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  const { t } = useLanguage();
  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className={cn(
              'relative rounded-lg border border-border bg-card p-4 pr-8 shadow-lg',
              'data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
              'transition-transform duration-200',
            )}
          >
            <Toast.Title className="text-sm font-semibold" />
            <Toast.Description className="mt-1 text-sm text-muted-foreground" />
            <Toast.Close
              className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label={t('toast.closeNotification')}
            >
              <X className="h-3.5 w-3.5" />
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
