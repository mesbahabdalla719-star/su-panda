'use client';

import Link from 'next/link';
import { useFavorites } from '@/context/favorites-context';
import { useLanguage } from '@/context/language-context';
import { DishCard } from '@/components/dish-card';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-8 text-center">{t('my_favorites')}</h1>
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map(dish => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-8">{t('empty_favorites')}</p>
          <Button asChild>
            <Link href="/">{t('browse_dishes')}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
