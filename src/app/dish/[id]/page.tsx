'use client';

import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { useFavorites } from '@/context/favorites-context';
import { useNutrition } from '@/context/nutrition-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Heart, Flame, Beef, Sparkles, Scale, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import type { Dish } from '@/lib/types';

function DishLoadingSkeleton() {
    return (
        <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
        </div>
    );
}

export default function DishPage() {
  const params = useParams();
  const { id } = params;
  const { locale, t } = useLanguage();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addNutritionEntry } = useNutrition();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const dishDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'dishes', id as string);
  }, [firestore, id]);

  const { data: firestoreDish, isLoading } = useDoc<Dish>(dishDocRef);

  const dish = firestoreDish;
  
  if (isLoading) {
    return <DishLoadingSkeleton />;
  }
  
  if (!dish) {
    notFound();
  }

  const placeholderImage = PlaceHolderImages.find(img => img.id === dish.imageId);
  const isFav = isFavorite(dish.id);

  const handleAddToCart = () => {
    addToCart(dish);
    addNutritionEntry({ protein: dish.protein, sugar: dish.sugar, calories: dish.calories });
    toast({
      title: t('added_to_cart'),
      description: dish.name[locale],
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="aspect-square relative w-full rounded-lg overflow-hidden shadow-lg">
          {placeholderImage && (
            <Image
              src={placeholderImage.imageUrl}
              alt={dish.name[locale]}
              fill
              className={cn("p-2", "object-cover")}
              data-ai-hint={placeholderImage.imageHint}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold font-headline">{dish.name[locale]}</h1>
          <p className="text-lg text-muted-foreground mt-2">{dish.description[locale]}</p>
          
          <Separator className="my-6" />

          <div className="text-lg mb-6 space-y-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2" title={t('portion_size')}>
                 <Scale className="h-6 w-6 text-muted-foreground" />
                 <span className="font-medium">{dish.portionSize}</span>
               </div>
              <div className="text-2xl font-bold text-primary">
                {dish.price} {t('currency')}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" title={t('calories')}>
                <Flame className="h-6 w-6 text-accent" />
                <span className="font-medium">{dish.calories} {t('calories_short')}</span>
              </div>
               <div className="flex items-center gap-2" title={t('protein')}>
                <Beef className="h-6 w-6 text-primary" />
                <span className="font-medium">{dish.protein}g</span>
              </div>
              <div className="flex items-center gap-2" title={t('sugar')}>
                <Sparkles className="h-6 w-6 text-destructive" />
                <span className="font-medium">{dish.sugar}g</span>
              </div>
            </div>
          </div>
          
           <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3 text-sm mb-6">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{dish.dailyTip[locale]}</p>
           </div>


          <div className="flex items-center gap-4">
            <Button onClick={handleAddToCart} size="lg" className="flex-grow">
              <ShoppingCart className="mr-2 h-5 w-5" />
              {t('add_to_cart')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => toggleFavorite(dish)}
              className="px-4"
            >
              <Heart className={cn('h-5 w-5', isFav && 'fill-destructive text-destructive')} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
