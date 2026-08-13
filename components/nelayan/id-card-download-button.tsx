'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/context';
import { IdCard, type IdCardProps } from './id-card';

export function IdCardDownloadButton({ nelayan, koperasiNama, kapalNama }: IdCardProps) {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `id-card-${nelayan.id}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
        <div ref={cardRef}>
          <IdCard nelayan={nelayan} koperasiNama={koperasiNama} kapalNama={kapalNama} />
        </div>
      </div>
      <Button onClick={handleDownload} disabled={downloading}>
        <Download className="mr-2 h-4 w-4" />
        {downloading ? t('idCard.memproses') : t('idCard.unduhIdCard')}
      </Button>
    </>
  );
}
