'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShoppingCart, PackageSearch } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useLanguage } from '@/context/language-context';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Suspense } from 'react';

function FloatingButtonContent() {
  const { cartCount, isLoading } = useCart();
  const { t, direction } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const isOrderSuccessPage = pathname === '/order-success' && orderId;
  
  if (isOrderSuccessPage) {
     return (
      <div className={`fixed bottom-20 ${direction === 'rtl' ? 'right-6' : 'left-6'} z-50 animate-in fade-in zoom-in-95`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="lg" className="rounded-full h-16 w-16 shadow-lg group bg-primary hover:bg-primary/90">
              <Link href={`/my-account/orders/${orderId}`}>
                <PackageSearch className="h-7 w-7 transition-transform group-hover:scale-110" />
                <span className="sr-only">{t('track_order')}</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side={direction === 'rtl' ? 'left' : 'right'}>
            <p>{t('track_your_order')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className={`fixed bottom-20 ${direction === 'rtl' ? 'right-6' : 'left-6'} z-50 animate-in fade-in zoom-in-95`}>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button asChild size="lg" className="rounded-full h-16 w-16 shadow-lg group">
                    <Link href="/cart">
                        <ShoppingCart className="h-7 w-7 transition-transform group-hover:scale-110" />
                        <span className="sr-only">{t('cart')}</span>
                         {cartCount > 0 && (
                            <Badge variant="destructive" className="absolute top-0 right-0 h-6 w-6 justify-center text-sm rounded-full border-2 border-background">
                            {cartCount}
                            </Badge>
                        )}
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent side={direction === 'rtl' ? 'left' : 'right'}>
                <p>{t('shopping_cart')}</p>
            </TooltipContent>
        </Tooltip>
    </div>
  );
}

export function FloatingCartButton() {
  return (
    <Suspense>
      <FloatingButtonContent />
    </Suspense>
  )
}
