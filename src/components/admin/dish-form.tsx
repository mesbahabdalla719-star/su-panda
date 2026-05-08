'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { Dish, Category } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollArea } from '@/components/ui/scroll-area';

const categories: Category[] = ['breakfast', 'lunch', 'dinner', 'salads-appetizers', 'main-courses', 'snacks', 'desserts', 'hot-drinks', 'cold-drinks', 'kids-meals'];

const localizedStringSchema = z.object({
  en: z.string().min(1, { message: "This field is required in English." }),
  ar: z.string().min(1, { message: "This field is required in Arabic." }),
  ru: z.string().min(1, { message: "This field is required in Russian." }),
});

const formSchema = z.object({
  name: localizedStringSchema,
  description: localizedStringSchema,
  category: z.enum(categories, { required_error: "Category is required." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  calories: z.coerce.number().min(0, { message: "Calories must be a positive number." }),
  protein: z.coerce.number().min(0, { message: "Protein must be a positive number." }),
  sugar: z.coerce.number().min(0, { message: "Sugar must be a positive number." }),
  portionSize: z.string().min(1, { message: "Portion size is required." }),
  imageId: z.string().min(1, { message: "An image is required." }),
  dailyTip: localizedStringSchema,
});

type DishFormValues = z.infer<typeof formSchema>;

interface DishFormProps {
  dish?: Dish | null;
  onSave: () => void;
  onCancel: () => void;
}

const LocalizedInputGroup = ({ control, name, label, isTextarea = false }: { control: any, name: string, label: string, isTextarea?: boolean }) => {
    const InputComponent = isTextarea ? Textarea : Input;
    return (
        <div className="space-y-4 rounded-md border p-4">
            <p className="font-medium text-sm">{label}</p>
            <FormField control={control} name={`${name}.en`} render={({ field }) => (
                <FormItem><FormLabel>English</FormLabel><FormControl><InputComponent placeholder={`${label} in English`} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name={`${name}.ar`} render={({ field }) => (
                <FormItem><FormLabel>العربية (Arabic)</FormLabel><FormControl><InputComponent placeholder={`${label} in Arabic`} dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name={`${name}.ru`} render={({ field }) => (
                <FormItem><FormLabel>Русский (Russian)</FormLabel><FormControl><InputComponent placeholder={`${label} in Russian`} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
    );
};


export function DishForm({ dish, onSave, onCancel }: DishFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DishFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: { en: '', ar: '', ru: '' },
      description: { en: '', ar: '', ru: '' },
      category: 'main-courses',
      price: 0,
      calories: 0,
      protein: 0,
      sugar: 0,
      portionSize: '',
      imageId: '',
      dailyTip: { en: '', ar: '', ru: '' },
    },
  });

  useEffect(() => {
    if (dish) {
      form.reset(dish);
    } else {
      form.reset({
        name: { en: '', ar: '', ru: '' },
        description: { en: '', ar: '', ru: '' },
        category: 'main-courses',
        price: 0,
        calories: 0,
        protein: 0,
        sugar: 0,
        portionSize: '',
        imageId: '',
        dailyTip: { en: '', ar: '', ru: '' },
      });
    }
  }, [dish, form]);


  async function onSubmit(values: DishFormValues) {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      if (dish) {
        const dishRef = doc(firestore, 'dishes', dish.id);
        await updateDocumentNonBlocking(dishRef, values);
        toast({ title: t('dish_updated'), description: `"${values.name.en}" ${t('has_been_updated')}.` });
      } else {
        const dishesColRef = collection(firestore, 'dishes');
        await addDocumentNonBlocking(dishesColRef, values);
        toast({ title: t('dish_created'), description: `"${values.name.en}" ${t('has_been_added')}.` });
      }
      onSave();
    } catch (error) {
      console.error("Error saving dish:", error);
      toast({ variant: 'destructive', title: t('error'), description: t('dish_save_error') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[65vh] pr-6">
            <div className="space-y-6">
                <LocalizedInputGroup control={form.control} name="name" label={t('dish_name')} />
                <LocalizedInputGroup control={form.control} name="description" label={t('description')} isTextarea />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('category')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{t(cat)}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="imageId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Image</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select an image" /></SelectTrigger></FormControl>
                                <SelectContent>
                                {PlaceHolderImages.map(img => (
                                    <SelectItem key={img.id} value={img.id}>{img.id} - {img.description}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                             <FormMessage />
                        </FormItem>
                    )} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>{t('price')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="portionSize" render={({ field }) => (
                        <FormItem><FormLabel>{t('portion_size')}</FormLabel><FormControl><Input placeholder="e.g. 250g" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField control={form.control} name="calories" render={({ field }) => (
                        <FormItem><FormLabel>{t('calories')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="protein" render={({ field }) => (
                        <FormItem><FormLabel>{t('protein')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="sugar" render={({ field }) => (
                        <FormItem><FormLabel>{t('sugar')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <LocalizedInputGroup control={form.control} name="dailyTip" label={t('daily_tip')} isTextarea />
            </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dish ? t('save_changes') : t('create_dish')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
