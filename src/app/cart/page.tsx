'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Trash2, Plus, Minus } from 'lucide-react';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { locale, t } = useLanguage();

  if (cartItems.length === 0) {
    return (
        <div className="text-center py-10">
          <h1 className="text-3xl font-bold font-headline mb-4">{t('shopping_cart')}</h1>
          <p className="text-muted-foreground mb-8">{t('empty_cart')}</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild>
              <Link href="/">{t('browse_dishes')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/my-account/orders">{t('track_your_order')}</Link>
            </Button>
          </div>
        </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-8 text-center">{t('shopping_cart')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {cartItems.map(({ dish, quantity }) => {
            const placeholderImage = PlaceHolderImages.find(img => img.id === dish.imageId);
            return (
              <div key={dish.id} className="flex items-center gap-4 bg-card p-4 rounded-lg shadow-sm">
                <div className="relative h-24 w-24 rounded-md overflow-hidden flex-shrink-0">
                  {placeholderImage && (
                    <Image
                      src={placeholderImage.imageUrl}
                      alt={dish.name[locale]}
                      fill
                      className="object-cover"
                      data-ai-hint={placeholderImage.imageHint}
                    />
                  )}
                </div>
                <div className="flex-grow">
                  <Link href={`/dish/${dish.id}`} className="font-semibold hover:text-primary">{dish.name[locale]}</Link>
                  <p className="text-sm text-muted-foreground">{dish.price} {t('currency')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-md border">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-r-none"
                            onClick={() => updateQuantity(dish.id, quantity - 1)}
                            disabled={quantity <= 1}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-center w-8">{quantity}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-l-none"
                            onClick={() => updateQuantity(dish.id, quantity + 1)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(dish.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="md:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">{t('subtotal')}</h2>
              <div className="flex justify-between items-center mb-6">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-bold text-2xl">{totalPrice.toFixed(2)} {t('currency')}</span>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">{t('checkout')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
