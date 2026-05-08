'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { useFavorites } from '@/context/favorites-context';
import { useNutrition } from '@/context/nutrition-context';
import { useToast } from '@/hooks/use-toast';
import type { Dish } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ShoppingCart, Heart, Flame, Beef, Sparkles, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface DishCardProps {
  dish: Dish;
}

export function DishCard({ dish }: DishCardProps) {
  const { locale, t } = useLanguage();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addNutritionEntry } = useNutrition();
  const { toast } = useToast();

  const placeholderImage = PlaceHolderImages.find(img => img.id === dish.imageId);

  const handleAddToCart = () => {
    addToCart(dish);
    addNutritionEntry({ protein: dish.protein, sugar: dish.sugar, calories: dish.calories });
    toast({
      title: t('added_to_cart'),
      description: dish.name[locale],
    });
  };

  const isFav = isFavorite(dish.id);

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group bg-card">
      <CardHeader className="p-0">
        <Link href={`/dish/${dish.id}`} className="block">
          <div className="aspect-[4/3] relative w-full overflow-hidden">
            {placeholderImage && (
              <Image
                src={placeholderImage.imageUrl}
                alt={dish.name[locale]}
                fill
                className={cn(
                  "transition-transform duration-500 group-hover:scale-110 p-2",
                  "object-cover"
                )}
                data-ai-hint={placeholderImage.imageHint}
              />
            )}
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-5 flex-grow">
        <Link href={`/dish/${dish.id}`} className="block">
          <CardTitle className="text-xl font-semibold font-headline text-foreground hover:text-primary transition-colors">{dish.name[locale]}</CardTitle>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">{dish.description[locale]}</p>
        </Link>
      </CardContent>
      <Separator />
      <div className="p-5 space-y-4 text-sm text-muted-foreground">
        <div className="flex justify-between items-center">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2" title={t('portion_size')}>
                        <Scale className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{dish.portionSize}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('portion_size')}</p>
                </TooltipContent>
            </Tooltip>
             <div className="font-bold text-lg text-primary">
                {dish.price} {t('currency')}
            </div>
        </div>
        <div className="flex justify-between items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-accent" />
                        <span className="font-medium">{dish.calories} {t('calories_short')}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('calories')}</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                        <Beef className="h-5 w-5 text-primary/80" />
                        <span className="font-medium">{dish.protein}g</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('protein')}</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-destructive/80" />
                        <span className="font-medium">{dish.sugar}g</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('sugar')}</p>
                </TooltipContent>
            </Tooltip>
        </div>
      </div>
      <CardFooter className="p-4 bg-muted/30">
        <div className="flex w-full justify-between items-center gap-2">
          <Button onClick={handleAddToCart} className="w-full">
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t('add_to_cart')}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
               <Button
                variant="outline"
                size="icon"
                onClick={() => toggleFavorite(dish)}
                className="shrink-0"
              >
                <Heart className={cn('h-5 w-5', isFav && 'fill-destructive text-destructive')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFav ? t('remove_from_favorites') : t('add_to_favorites')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}
