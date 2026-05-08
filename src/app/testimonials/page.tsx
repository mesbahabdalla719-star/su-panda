'use client';

import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, serverTimestamp } from 'firebase/firestore';
import { useFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { LocalizedString } from '@/lib/types';

// New component for star rating input
const StarRatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            onClick={() => onChange(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer bg-transparent border-none p-0"
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                ratingValue <= (hover || value)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

function AddTestimonialForm() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const formSchema = z.object({
    author: z.string().min(2, { message: t('name_error') }),
    text: z.string().min(10, { message: t('feedback_error') }),
    rating: z.number().min(1, { message: t('rating_error') }).max(5),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { author: "", text: "", rating: 0 },
  });
  
  useEffect(() => {
    if (user?.displayName) {
        form.setValue('author', user.displayName);
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;

    const localizedText: LocalizedString = {
        en: locale === 'en' ? values.text : '',
        ar: locale === 'ar' ? values.text : '',
        ru: locale === 'ru' ? values.text : '',
    };
    
    const testimonialData = {
      author: values.author,
      text: localizedText,
      rating: values.rating,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      const collectionRef = collection(firestore, "testimonials");
      await addDocumentNonBlocking(collectionRef, testimonialData);
      toast({
        title: t('testimonial_submitted_title'),
        description: t('testimonial_submitted_desc'),
      });
      form.reset({author: user.displayName || "", text: "", rating: 0});
    } catch (error) {
      console.error("Error submitting testimonial: ", error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('testimonial_submit_error'),
      });
    }
  }
  
  return (
    <Card className="bg-card/70 border-border/50">
      <CardHeader>
        <CardTitle>{t('add_your_testimonial')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('your_name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('your_name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('your_feedback')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('your_feedback')} {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('your_rating')}</FormLabel>
                  <FormControl>
                    <StarRatingInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('submit_testimonial')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}


export default function TestimonialsPage() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">{t('add_your_testimonial')}</h1>
      </div>

      {isUserLoading && (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
        </div>
       )}

       {!isUserLoading && user && (
        <div className="mb-12">
          <AddTestimonialForm />
        </div>
      )}

      {!isUserLoading && !user && (
        <div className="text-center bg-card p-8 rounded-lg">
            <p className="text-muted-foreground mb-4">{t('must_be_logged_in')}</p>
            <Button asChild>
                <Link href="/login">{t('login')}</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
