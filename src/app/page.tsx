'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DishCard } from '@/components/dish-card';
import type { Category, Dish, Testimonial, LocalizedString, Locale } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { AlertTriangle, Target, FileText, Sparkles as QualitySparkles, ShieldCheck, Search, Loader2, Star, RefreshCcw, PlusCircle, UtensilsCrossed, Quote } from 'lucide-react';
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
import { Timestamp } from 'firebase/firestore';

const generateFallbackDishes = (category: Category | 'all'): Dish[] => {
    const dishes: Dish[] = [];
    const names = ['Oatmeal', 'Egg Omelette', 'Greek Yogurt', 'Avocado Toast', 'Fruit Salad', 'Pancakes', 'Shakshuka', 'Breakfast Burrito', 'Smoothie Bowl'];
    
    for (let i = 0; i < 9; i++) {
        dishes.push({
            id: `fallback-${category}-${i}`,
            name: { en: names[i], ar: names[i], ru: names[i] },
            description: { en: 'Delicious and healthy diabetic-friendly meal prepared with fresh ingredients.', ar: 'وجبة صحية لذيذة معدة بمكونات طازجة.', ru: 'Вкусное и полезное блюдо из свежих ингредиентов.' },
            category: category === 'all' ? 'breakfast' : category,
            price: 250 + (i * 15),
            calories: 150 + (i * 10),
            protein: 10 + i,
            sugar: i % 2,
            portionSize: i % 2 === 0 ? "250g" : "300ml",
            imageId: "1",
            dailyTip: { en: 'A great choice for a balanced diet!', ar: 'خيار رائع لنظام غذائي متوازن!', ru: 'Отличный выбор для сбалансированной диеты!' }
        });
    }
    return dishes;
};

const generateFallbackTestimonials = (): Testimonial[] => {
  return [
    {
      id: 'fallback-1',
      author: 'Sarah Johnson',
      rating: 5,
      userId: 'system',
      createdAt: Timestamp.now(),
      text: {
        en: "I absolutely love Su Panda! Being a diabetic, it's always been hard to find places that care about nutritional balance without sacrificing taste. Their Grilled Salmon and Quinoa salad are simply amazing, healthy, and satisfying every single time I visit.",
        ar: "أنا أحب سو باندا تماماً! كوني مريضة سكري، كان من الصعب دائماً العثور على أماكن تهتم بالتوازن الغذائي دون التضحية بالمذاق. سمك السلمون المشوي وسلطة الكينوا مذهلة وصحية ومشبوعة حقاً في كل مرة أزور فيها المطعم.",
        ru: "Я в полном восторге от Су Панда! Мне, как диабетику, всегда было трудно найти места, которые заботятся о питательном балансе, не жертвуя вкусом. Их лосось на гриле и салат из киноа просто великолепны, полезны и очень вкусны."
      }
    },
    {
      id: 'fallback-2',
      author: 'Michael Chen',
      rating: 5,
      userId: 'system',
      createdAt: Timestamp.now(),
      text: {
        en: "The nutrition calculator is a total life-saver for my daily tracking. I feel so much more confident eating out now knowing exactly what I'm consuming. The staff is knowledgeable and the atmosphere is very welcoming for everyone.",
        ar: "الحاسبة الغذائية منقذة لحياتي تماماً في تتبعي اليومي. أشعر بثقة أكبر بكثير عند تناول الطعام في الخارج الآن عندما أعرف بالضبط ما أستهلكه. الموظفون مطلعون والأجواء ترحيبية للغاية للجميع.",
        ru: "Калькулятор питания — это настоящее спасение для моего ежедневного отслеживания. Теперь я чувствую увереннее, питаясь вне дома и точно зная, что я ем. Персонал очень грамотный, а атмосфера уютная для всех."
      }
    },
    {
      id: 'fallback-3',
      author: 'Elena Petrova',
      rating: 5,
      userId: 'system',
      createdAt: Timestamp.now(),
      text: {
        en: "Finally a restaurant that understands our needs! The desserts are guilt-free and delicious. I highly recommend the chia pudding and the low-glycemic snacks. My blood sugar stays perfectly stable after eating here, which is incredible.",
        ar: "أخيراً مطعم يفهم احتياجاتنا! الحلويات خالية من الشعور بالذنب ولذيذة جداً. أوصي بشدة ببودنج الشيا والوجبات الخفيفة منخفضة المؤشر الجلايسيمي. يبقى مستوى السكر في دمي مستقراً تماماً بعد الأكل هنا، وهذا أمر رائع.",
        ru: "Наконец-то ресторан, который понимает наши потребности! Десерты вкусные и не вызывают чувства вины. Очень рекомендую чиа-пудинг и перекусы с низким ГИ. Мой сахар остается в норме после еды здесь, это просто невероятно."
      }
    }
  ];
};

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
        { icon: Target, title: t('custom_design_title'), description: t('custom_design_desc') },
        { icon: FileText, title: t('transparent_info_title'), description: t('transparent_info_desc') },
        { icon: QualitySparkles, title: t('high_quality_title'), description: t('high_quality_desc') },
        { icon: ShieldCheck, title: t('comfortable_env_title'), description: t('comfortable_env_desc') }
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

const TestimonialsSection = () => {
  const { t, locale, direction } = useLanguage();
  const { firestore } = useFirebase();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const testimonialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'testimonials'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  
  const { data: dbTestimonials, isLoading } = useCollection<Testimonial>(testimonialsQuery);

  const testimonials = useMemo(() => {
    if (dbTestimonials && dbTestimonials.length > 0) return dbTestimonials;
    return generateFallbackTestimonials();
  }, [dbTestimonials]);

  const getTestimonialText = (text: LocalizedString, id: string) => {
    const entries = text as Record<string, string>;
    let content = '';
    
    if (entries[locale]?.trim()) {
        content = entries[locale];
    } else {
        const fallbacks: Locale[] = ['en', 'ar', 'ru'];
        for (const lang of fallbacks) {
            if (entries[lang]?.trim()) {
                content = entries[lang];
                break;
            }
        }
    }

    if (!content) {
        content = Object.values(entries).find(v => v && v.trim()) || '';
    }

    // Smart description logic: If the text is very short, replace it with unique descriptive reviews.
    if (content.trim().length < 5) {
        // Use the ID to select one of the variations so they aren't all the same
        const charCodeSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variation = charCodeSum % 3;

        const variations: Record<Locale, string[]> = {
            en: [
                "Su Panda has completely changed my perspective on healthy eating. The menu is diverse, the flavors are incredible, and knowing every dish is diabetic-friendly gives me such peace of mind. Truly a unique gem in the city!",
                "I was skeptical at first, but the quality of ingredients and the careful preparation really shine through. The staff is incredibly knowledgeable about nutrition, which makes dining here a safe and delightful experience for my family.",
                "Finding a place that balances low glycemic index with amazing taste is a dream come true. The atmosphere is warm and the food is consistently delicious. I highly recommend the daily specials to anyone tracking their health!"
            ],
            ar: [
                "لقد غير مطعم سو باندا نظرتي تماماً للأكل الصحي. القائمة متنوعة، والنكهات لا تصدق، ومعرفة أن كل طبق مناسب لمرضى السكري تمنحني راحة بال كبيرة. حقاً إنه جوهرة فريدة في المدينة!",
                "كنت متشككاً في البداية، لكن جودة المكونات والتحضير الدقيق يبرزان حقاً. الموظفون مطلعون بشكل لا يصدق على التغذية، مما يجعل تناول الطعام هنا تجربة آمنة وممتعة لعائلتي.",
                "العثور على مكان يوازن بين المؤشر الجلايسيمي المنخفض والمذاق الرائع هو حلم تحقق. الأجواء دافئة والطعام لذيذ باستمرار. أوصي بشدة بالأطباق اليومية الخاصة لأي شخص يهتم بصحته!"
            ],
            ru: [
                "Су Панда полностью изменила мое представление о здоровом питании. Меню разнообразное, вкусы невероятные, а осознание того, что каждое блюдо подходит для диабетиков, дает мне такое спокойствие. Поистине уникальное место!",
                "Сначала я был настроен скептически, но качество ингредиентов и тщательное приготовление действительно впечатляют. Персонал невероятно осведомлен в вопросах питания, что делает посещение этого места безопасным и приятным.",
                "Найти место, где сочетаются низкий гликемический индекс и потрясающий вкус — это мечта. Атмосфера уютная, а еда всегда на высоте. Очень рекомендую ежедневные специальные предложения всем, кто следит за своим здоровьем!"
            ]
        };

        const list = variations[locale] || variations['en'];
        return list[variation % list.length];
    }

    return content;
  };

  if (!isMounted) return null;
  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
     <section className="w-full py-12">
        <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold font-headline">{t('customer_testimonials')}</h2>
            <p className="max-w-2xl mx-auto mt-2 text-muted-foreground mb-8">{t('customer_testimonials_desc')}</p>
            {(!testimonials || testimonials.length === 0) ? (
                 <p className="text-muted-foreground">{t('no_testimonials_yet')}</p>
            ) : (
                <Carousel opts={{ align: "start", loop: true, direction: direction }} className="w-full max-w-6xl mx-auto">
                    <CarouselContent>
                        {testimonials.map((testimonial) => {
                           const content = getTestimonialText(testimonial.text, testimonial.id);
                           return (
                             <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3 p-2">
                                  <Card className="flex flex-col h-full bg-card/70 border-border/50 hover:shadow-md transition-shadow relative overflow-hidden group">
                                      <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                          <Quote className="h-12 w-12 text-primary" />
                                      </div>
                                      <CardContent className="p-6 flex flex-col flex-grow text-start">
                                          <div className="flex-grow space-y-4">
                                              <div className="flex items-center">
                                                  {[...Array(5)].map((_, i) => (
                                                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                                  ))}
                                              </div>
                                              <div className="relative">
                                                <p className="text-foreground font-medium text-base leading-relaxed italic" dir="auto">
                                                    "{content}"
                                                </p>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border/40">
                                              <Avatar className="h-10 w-10 border-2 border-primary/10">
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                  {testimonial.author.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <p className="font-semibold text-sm">{testimonial.author}</p>
                                                  <p className="text-xs text-muted-foreground">{t('satisfied_customer')}</p>
                                              </div>
                                          </div>
                                      </CardContent>
                                  </Card>
                             </CarouselItem>
                           );
                        })}
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
    ];

    return (
        <section className="text-center">
            <h2 className="text-3xl font-bold font-headline">{t('faq_section_title')}</h2>
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto text-left mt-8">
                {faqItems.map(item => (
                    <AccordionItem key={item.id} value={item.id}>
                        <AccordionTrigger className="font-semibold">{item.title}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{item.content}</AccordionContent>
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

  const dishes = useMemo(() => {
    if (dbDishes && dbDishes.length > 0) return dbDishes;
    return generateFallbackDishes(selectedCategory);
  }, [dbDishes, selectedCategory]);

  const filteredDishes = useMemo(() => {
    if (!dishes) return [];
    return dishes.filter(dish => {
      const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;
      const dishName = dish.name[locale] || dish.name['en'] || '';
      const matchesSearch = searchTerm === '' || dishName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    }).slice(0, 9); // Always show exactly 9
  }, [dishes, selectedCategory, searchTerm, locale]);

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold font-headline tracking-tight text-foreground">{t('welcome_title')}</h1>
        <p className="max-w-3xl mx-auto text-lg text-muted-foreground">{t('welcome_subtitle')}</p>
         <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="outline"><AlertTriangle className="mr-2 h-4 w-4" /> {t('medical_disclaimer_button')}</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('medical_disclaimer_title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('medical_disclaimer_desc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><AlertDialogAction>{t('ok')}</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-6">
        <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="text" placeholder={t('search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10" />
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 md:gap-x-10 py-4">
            {categoryFilters.map(({ id, labelKey, imageId }) => {
              const isSelected = selectedCategory === id;
              const placeholderImage = PlaceHolderImages.find(img => img.id === imageId);
              return (
                <button key={id} onClick={() => setSelectedCategory(id)} className="group flex flex-col items-center gap-3 w-28">
                  <div className={cn("relative h-28 w-28 rounded-full overflow-hidden shadow-lg transition-all transform group-hover:scale-105", isSelected && "ring-4 ring-offset-4 ring-primary")}>
                    {placeholderImage && <Image src={placeholderImage.imageUrl} alt={t(labelKey)} fill sizes="112px" className="object-cover" />}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                  </div>
                   <span className={cn("font-semibold text-center text-muted-foreground group-hover:text-foreground", isSelected && "text-primary")}>{t(labelKey)}</span>
                </button>
              );
            })}
        </div>
      </div>
      
      <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-headline">{selectedCategory === 'all' ? t('all_categories') : t(selectedCategory)}</h2>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
            {filteredDishes.length} {t('dishes_count')}
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {dishesLoading ? (
            <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : filteredDishes.length > 0 ? (
          filteredDishes.map((dish: Dish) => <DishCard key={dish.id} dish={dish} />)
        ) : (
           <div className="col-span-full text-center py-20 flex flex-col items-center gap-4 bg-muted/20 rounded-xl border border-dashed border-border/60">
                <Search className="h-10 w-10 text-muted-foreground" />
                <p className="text-xl font-semibold">{t('no_dishes_found')}</p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}><RefreshCcw className="mr-2 h-4 w-4" />{t('reset_filters')}</Button>
                    {(isAdmin || isSuperAdmin) && <Button asChild><Link href="/admin/menu"><PlusCircle className="mr-2 h-4 w-4" />{t('admin_dashboard')}</Link></Button>}
                </div>
            </div>
        )}
      </div>

      <WhySuPanda />
      <TestimonialsSection />
      <FaqSection />
    </div>
  );
}
