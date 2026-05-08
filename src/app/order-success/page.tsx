'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home, PackageSearch, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function OrderSuccessContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setIsCopied(true);
    toast({ title: t('copied_to_clipboard', { value: 'Order ID' }) });
    setTimeout(() => setIsCopied(false), 2000);
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center p-6">
        <CardHeader className="items-center">
          <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">{t('order_success_title')}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            {t('order_success_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {orderId && (
            <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-md flex items-center justify-between gap-4 text-left">
              <div>
                <p className="text-sm text-muted-foreground">{t('order_id_label')}</p>
                <p className="text-lg font-mono font-semibold tracking-wider text-primary">#{orderId.slice(0, 8)}...</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!orderId}>
                  {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{t('order_success_follow_up')}</p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" variant="outline">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                {t('back_to_home')}
              </Link>
            </Button>
            {orderId && (
                <Button asChild size="lg">
                    <Link href={`/my-account/orders/${orderId}`}>
                        <PackageSearch className="mr-2 h-5 w-5" />
                        {t('track_order')}
                    </Link>
                </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
