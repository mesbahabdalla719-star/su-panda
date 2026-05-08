'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DishCard } from '@/components/dish-card';
import type { Category, Dish, Testimonial } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { AlertTriangle, Target, FileText, Sparkles as QualitySparkles, ShieldCheck, HelpCircle, Search, Loader2, Star, RefreshCcw, PlusCircle, UtensilsCrossed } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useAdmin } from '@/hooks/use-admin';
import Link from 'next/link';

// Generator for fallback featured dishes to ensure every category has 10 items (100 total)
const generateFeaturedDishes = (): Dish[] => {
    const categories: Category[] = ['breakfast', 'lunch', 'dinner', 'salads-appetizers', 'main-courses', 'snacks', 'desserts', 'hot-drinks', 'cold-drinks', 'kids-meals'];
    const dishes: Dish[] = [];
    
    const categoryNames: Record<string, string[]> = {
        'breakfast': ['Classic Oatmeal', 'Veggie Omelette', 'Berry Greek Yogurt', 'Avocado Toast', 'Summer Fruit Bowl', 'Protein Pancakes', 'Traditional Shakshuka', 'Egg White Burrito', 'Acai Smoothie Bowl', 'Cottage Cheese Mix'],
        'lunch': ['Grilled Chicken Salad', 'Quinoa Power Bowl', 'Turkey Club Wrap', 'Hearty Lentil Soup', 'Mediterranean Tuna', 'Beef Stir Fry', 'Chickpea Medley', 'Lemon Herb Salmon', 'Garden Veggie Plate', 'Asian Slaw'],
        'dinner': ['Baked Atlantic Cod', 'Sirloin & Broccoli', 'Zucchini Pesto Pasta', 'Rotisserie Chicken', 'Coconut Veggie Curry', 'Garlic Grilled Shrimp', 'Lamb Souvlaki', 'Mushroom Risotto', 'Eggplant Bake', 'Sesame Tofu'],
        'salads-appetizers': ['Fresh Garden Salad', 'Kale Caesar', 'Traditional Greek', 'Creamy Hummus', 'Smoky Baba Ganoush', 'Fresh Spring Rolls', 'Tomato Caprese', 'Parsley Tabbouleh', 'Vine Leaf Dolma', 'Olive Tapenade'],
        'main-courses': ['Signature Ribeye', 'Lemon Roast Chicken', 'Pan Seared Seabass', 'Spinach Lasagna', 'Traditional Beef Stew', 'Honey Glazed Salmon', 'Ratatouille', 'Chicken Tagine', 'Grilled Lamb Chops', 'Stuffed Peppers'],
        'snacks': ['Roasted Almonds', 'Green Apple Slices', 'Baby Carrots', 'Natural Popcorn', '70% Dark Cocoa', 'Brown Rice Cakes', 'Nut Trail Mix', 'Low-Fat Cheese', 'Red Seedless Grapes', 'Roasted Chickpeas'],
        'desserts': ['Mixed Berry Parfait', 'Lime Sugar-Free Jello', 'Cinnamon Baked Apple', 'Chewy Oat Cookies', 'Mango Sorbet', 'Vanilla Chia Pudding', 'Strawberry Bark', 'Almond Flour Cake', 'Poached Pears', 'Chocolate Mousse'],
        'hot-drinks': ['Premium Green Tea', 'Double Black Coffee', 'Chamomile Herbal', 'Zesty Hot Lemon', 'Warm Cinnamon', 'Refreshing Mint Tea', 'Earl Grey Classic', 'Decaf Roast', 'Ginger Spice Tea', 'Oolong Reserve'],
        'cold-drinks': ['Iced Hibiscus', 'Sparkling Lime', 'Cold Brew Nitro', 'Fresh Lemonade', 'Blueberry Smoothie', 'Matcha Iced Tea', 'Cucumber Water', 'Minty Cooler', 'Fruit Infusion', 'Detox Green Juice'],
        'kids-meals': ['Mini Chicken Sliders', 'Baked Nuggets', 'Rainbow Fruit Kabobs', 'Healthy Mac & Cheese', 'Crunchy Veggie Sticks', 'Mini Pita Pizza', 'Peanut Butter Slices', 'Berry Yogurt Tube', 'Mini Oat Pancakes', 'Mild Beef Taco']
    };

    categories.forEach((cat, catIdx) => {
        const names = categoryNames[cat];
        for (let i = 0; i < 10; i++) {
            dishes.push({
                id: `fallback-${cat}-${i}`,
                name: {
                    en: names[i],
                    ar: `خيار ${cat} - ${names[i]}`,
                    ru: `${names[i]} - Вариант`
                },
                description: {
                    en: `A nutritious and delicious ${cat} option, carefully prepared for diabetic health.`,
                    ar: `وجبة ${cat} صحية ولذيذة، معدة بعناية لتناسب مرضى السكري.`,
                    ru: `Питательный и вкусный вариант ${cat}, тщательно приготовленный для здоровья диабетиков.`
                },
                category: cat,
                price: 250 + (i * 25) + (catIdx * 15),
                calories: 100 + (i * 12) + (catIdx * 8),
                protein: 5 + i + catIdx,
                sugar: i % 3,
                portionSize: i % 2 === 0 ? "250g" : "300ml",
                imageId: cat.includes('drink') ? "51" : (cat.includes('salad') ? "11" : "1"),
                dailyTip: {
                    en: "Always monitor your portion sizes.",
                    ar: "راقب أحجام حصصك دائمًا.",
                    ru: "Всегда следите за размером порций."
                }
            });
        }
    });
    return dishes;
};

const FEATURED_DISHES = generateFeaturedDishes();

const categoryFilters: { id: Category | 'all'; labelKey: string; imageId: string }[] = [
  { id: 'all', labelKey: 'all_categories', imageId: 'category-main' },
  { id: 'breakfast', labelKey: 'breakfast', imageId: 'category-breakfast' },
  { id: 'lunch', labelKey: 'lunch', imageId: 'category-lunch' },
  { id: 'dinner', labelKey: 'dinner', imageId: 'category-dinner' },
  { id: 'salads-appetizers', labelKey: 'salads_appetizers', imageId: 'category-salads' },
  { id: 'main-courses', labelKey: 'main_courses', imageId: 'category-main' },
  { id: 'snacks', labelKey: 'snacks', imageId: 'category-snacks' },
  { id: 'desserts', labelKey: 'desserts', imageId: 'category-desserts' },
  { id: 'hot-drinks', labelKey: 'hot_drinks', imageId: 'category-hot-drinks' },
  { id: 'cold-drinks', labelKey: 'cold_drinks', imageId: 'category-cold-drinks' },
  { id: 'kids-meals', labelKey: 'kids-meals', imageId: 'category-kids-meals' },
];

const WhySuPanda = () => {
    const { t } = useLanguage();

    const features = [
        {
            icon: Target,
            title: t('custom_design_title'),
            description: t('custom_design_desc')
        },
        {
            icon: FileText,
            title: t('transparent_info_title'),
            description: t('transparent_info_desc')
        },
        {
            icon: QualitySparkles,
            title: t('high_quality_title'),
            description: t('high_quality_desc')
        },
        {
            icon: ShieldCheck,
            title: t('comfortable_env_title'),
            description: t('comfortable_env_desc')
        }
    ];

    return (
        <section className="text-center">
            <h2 className="text-3xl font-bold font-headline">{t('why_su_panda_title')}</h2>
            <p className="max-w-2xl mx-auto mt-2 text-muted-foreground">{t('why_su_panda_subtitle')}</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                         <Card key={index} className="text-center bg-card/50 hover:bg-card transition-colors duration-300">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
                                    <Icon className="h-8 w-8" />
                                </div>
                                <CardTitle className="font-semibold text-lg">{feature.title}</CardTitle>
                                <CardDescription className="text-sm">{feature.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    )
                })}
            </div>
        </section>
    );
}

function DishesLoadingSkeleton() {
    return (
        <div className="col-span-full flex items-center justify-center py-20">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
        </div>
    );
}

const TestimonialsSection = () => {
  const { t, locale, direction } = useLanguage();
  const { firestore } = useFirebase();

  const testimonialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'testimonials'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: testimonialsData, isLoading: testimonialsLoading } = useCollection<Testimonial>(testimonialsQuery);

  const displayTestimonials = (testimonialsData && testimonialsData.length > 0 && testimonialsData.length < 6)
    ? [...Array(6)].map((_, i) => testimonialsData[i % testimonialsData.length])
    : testimonialsData;

  return (
     <section className="w-full py-12">
        <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold font-headline">{t('customer_testimonials')}</h2>
            <p className="max-w-2xl mx-auto mt-2 text-muted-foreground mb-8">{t('customer_testimonials_desc')}</p>
            {testimonialsLoading ? (
                <DishesLoadingSkeleton />
            ) : !displayTestimonials || displayTestimonials.length === 0 ? (
                 <p className="text-center text-muted-foreground col-span-full">{t('no_testimonials_yet')}</p>
            ) : (
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                        direction: direction,
                    }}
                    className="w-full max-w-xs sm:max-w-xl md:max-w-4xl lg:max-w-6xl mx-auto"
                >
                    <CarouselContent>
                        {displayTestimonials.map((testimonial, index) => (
                           <CarouselItem key={`${testimonial?.id || index}-${index}`} className="md:basis-1/2 lg:basis-1/3">
                             <div className="p-1">
                                <Card className="flex flex-col h-full bg-card/70 border-border/50">
                                    <CardContent className="p-6 flex flex-col flex-grow">
                                    <div className="flex-grow">
                                        <div className="flex items-center mb-4">
                                            {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    "h-5 w-5",
                                                    i < (testimonial?.rating || 5)
                                                    ? "text-yellow-400 fill-yellow-400"
                                                    : "text-gray-300 dark:text-gray-600"
                                                )}
                                            />
                                            ))}
                                        </div>
                                        <blockquote className="text-muted-foreground italic text-sm">
                                        "{testimonial?.text[locale] || testimonial?.text['en']}"
                                        </blockquote>
                                    </div>
                                    <div className="flex items-center gap-4 mt-6 pt-6 border-t">
                                        <Avatar>
                                        <AvatarImage src={`https://picsum.photos/seed/${testimonial?.userId}/40/40`} alt={testimonial?.author} />
                                        <AvatarFallback>{testimonial?.author?.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                        <p className="font-semibold">{testimonial?.author}</p>
                                        <p className="text-sm text-muted-foreground">{t('satisfied_customer')}</p>
                                        </div>
                                    </div>
                                    </CardContent>
                                </Card>
                              </div>
                           </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                </Carousel>
            )}
        </div>
     </section>
  );
}


const FaqSection = () => {
    const { t } = useLanguage();
    
    const faqItems = [
        { id: 'faq-1', title: t('faq_q1_title'), content: t('faq_q1_content') },
        { id: 'faq-2', title: t('faq_q2_title'), content: t('faq_q2_content') },
        { id: 'faq-3', title: t('faq_q3_title'), content: t('faq_q3_content') },
        { id: 'faq-4', title: t('faq_q4_title'), content: t('faq_q4_content') },
        { id: 'faq-5', title: t('faq_q5_title'), content: t('faq_q5_content') },
        { id: 'faq-6', title: t('faq_q6_title'), content: t('faq_q6_content') },
        { id: 'faq-7', title: t('faq_q7_title'), content: t('faq_q7_content') },
        { id: 'faq-8', title: t('faq_q8_title'), content: t('faq_q8_content') },
    ];

    return (
        <section className="text-center">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
                <HelpCircle className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold font-headline">{t('faq_section_title')}</h2>
            <p className="max-w-2xl mx-auto mt-2 text-muted-foreground mb-8">{t('faq_section_subtitle')}</p>
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto text-left">
                {faqItems.map(item => (
                    <AccordionItem key={item.id} value={item.id}>
                        <AccordionTrigger className="font-semibold">{item.title}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            {item.content}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    )
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { t, locale } = useLanguage();
  const { firestore } = useFirebase();
  const { isAdmin, isSuperAdmin } = useAdmin();

  const dishesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'dishes');
  }, [firestore]);

  const { data: dbDishes, isLoading: dishesLoading } = useCollection<Dish>(dishesQuery);

  // Fallback to full featured list (100 items) if database is empty
  const dishes = dbDishes && dbDishes.length > 0 ? dbDishes : FEATURED_DISHES;

  const filteredDishes = useMemo(() => {
    if (!dishes) return [];

    return dishes.filter(dish => {
      const matchesCategory = selectedCategory === 'all' 
        ? true 
        : dish.category === selectedCategory;

      const dishName = dish.name[locale] || dish.name['en'] || '';
      const matchesSearch = searchTerm === '' || dishName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [dishes, selectedCategory, searchTerm, locale]);
  
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold font-headline tracking-tight text-foreground">
          {t('welcome_title')}
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-muted-foreground">{t('welcome_subtitle')}</p>
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
               <AlertTriangle className="mr-2 h-4 w-4" /> {t('medical_disclaimer_button')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('medical_disclaimer_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('medical_disclaimer_desc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>{t('ok')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-6">
        <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
            />
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 md:gap-x-10 py-4">
            {categoryFilters.map(({ id, labelKey, imageId }) => {
              const isSelected = selectedCategory === id;
              const placeholderImage = PlaceHolderImages.find(img => img.id === imageId);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCategory(id)}
                  className="group focus:outline-none flex flex-col items-center gap-3 w-28"
                  aria-label={t(labelKey)}
                >
                  <div className={cn(
                    "relative h-28 w-28 rounded-full overflow-hidden shadow-lg transition-all duration-300 transform group-hover:scale-105",
                    isSelected && "ring-4 ring-offset-4 ring-primary ring-offset-background"
                  )}>
                    {placeholderImage && (
                       <Image
                          src={placeholderImage.imageUrl}
                          alt={t(labelKey)}
                          fill
                          sizes="112px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          data-ai-hint={placeholderImage.imageHint}
                        />
                    )}
                     <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300"></div>
                  </div>
                   <span className={cn(
                        "font-semibold text-center text-muted-foreground group-hover:text-foreground transition-colors",
                        isSelected && "text-primary"
                    )}>
                      {t(labelKey)}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
      
      {/* Dynamic Results Counter */}
      <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-headline">
               {selectedCategory === 'all' ? t('all_categories') : t(selectedCategory)}
            </h2>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
            {filteredDishes.length} {t('dishes_count')}
          </div>
      </div>

      {/* --- DISHES GRID START --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {dishesLoading ? (
          <DishesLoadingSkeleton />
        ) : filteredDishes.length > 0 ? (
          filteredDishes.map((dish: Dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))
        ) : (
           <div className="col-span-full space-y-12">
            <div className="text-center py-20 flex flex-col items-center gap-4 bg-muted/20 rounded-xl border border-dashed border-border/60">
                <div className="bg-background p-4 rounded-full shadow-sm">
                    <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="max-w-md">
                    <p className="text-xl font-semibold">{t('no_dishes_found')}</p>
                    <p className="text-muted-foreground mt-2">{t('no_dishes_in_category')}</p>
                </div>
                <div className="flex gap-4 mt-2">
                    <Button variant="outline" onClick={handleResetFilters}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {t('reset_filters')}
                    </Button>
                    {(isAdmin || isSuperAdmin) && (
                        <Button asChild>
                            <Link href="/admin/menu">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t('admin_dashboard')}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
          </div>
        )}
      </div>
      {/* --- DISHES GRID END --- */}

      <WhySuPanda />
      <TestimonialsSection />
      <FaqSection />

    </div>
  );
}
