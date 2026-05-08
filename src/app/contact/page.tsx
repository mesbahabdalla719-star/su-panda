'use client';

import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Phone, Mail, MapPin } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ContactPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const contactInfo = [
    {
      icon: Phone,
      title: t('phone'),
      value: '+7 (996) 066-79-62',
      href: 'tel:+79960667962',
    },
    {
      icon: Mail,
      title: t('email'),
      value: 'contact@supanda.com',
      href: 'mailto:contact@supanda.com',
    },
    {
      icon: MapPin,
      title: t('address'),
      value: 'Nizhny Novgorod, Russia',
      href: '#',
    },
  ];

  const formSchema = z.object({
    name: z.string().min(2, { message: t('name_error') }),
    email: z.string().email({ message: "Please enter a valid email." }),
    message: z.string().min(10, { message: t('feedback_error') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: { name: "", email: "", message: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
        toast({ variant: 'destructive', title: t('error'), description: t('db_not_available') });
        return;
    }
    
    try {
        const submissionData = {
            ...values,
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(firestore, 'contact-submissions'), submissionData);
        
        toast({
            title: t('message_sent_title'),
            description: t('message_sent_desc'),
        });
        form.reset();
    } catch (error) {
        console.error("Error submitting contact form:", error);
        toast({
            variant: 'destructive',
            title: t('error'),
            description: t('contact_submit_error'),
        });
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">{t('contact_us')}</h1>
        <p className="text-lg text-muted-foreground mt-2">{t('contact_us_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {contactInfo.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="items-center">
                <div className="bg-primary/10 text-primary p-4 rounded-full mb-4 w-fit">
                    <Icon className="h-8 w-8" />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <a href={item.href} className="text-muted-foreground hover:text-primary break-words">
                  {item.value}
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-16">
        <Card>
            <CardHeader>
                <CardTitle>{t('contact_form_title')}</CardTitle>
                <CardDescription>{t('contact_form_subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('email')}</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="you@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('message')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('your_feedback')} {...field} rows={5} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('send_message')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
