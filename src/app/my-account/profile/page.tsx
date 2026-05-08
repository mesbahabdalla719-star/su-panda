'use client';

import { useLanguage } from '@/context/language-context';
import { useUser, useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import type { Customer, Locale } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin } from '@/hooks/use-admin';


function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-16 w-16 text-primary animate-spin" />
    </div>
  );
}


export default function ProfilePage() {
  const { t, setLocale } = useLanguage();
  const { user, isUserLoading } = useUser();
  const { firestore, auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAdmin } = useAdmin();

  // --- Data Fetching ---
  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'customers', user.uid);
  }, [firestore, user]);

  const { data: customerData, isLoading: isCustomerLoading } = useDoc<Customer>(customerDocRef);
  
  // --- Form Definition ---
  const formSchema = z.object({
    firstName: z.string().min(2, { message: t('first_name_error') }),
    lastName: z.string().min(2, { message: t('last_name_error') }),
    email: z.string().email(),
    phoneNumber: z.string().min(8, { message: "Please enter a valid phone number." }),
    preferredLanguage: z.enum(['en', 'ar', 'ru']),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      preferredLanguage: "en",
    },
  });

  // --- Effect to populate form with fetched data ---
  useEffect(() => {
    if (customerData) {
      form.reset({
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: user?.email || '',
        phoneNumber: customerData.phoneNumber || '',
        preferredLanguage: customerData.preferredLanguage || 'en',
      });
    } else if (user) {
      // Fallback if firestore doc doesn't exist but user does
      form.reset({
        email: user.email || '',
        firstName: '',
        lastName: '',
        phoneNumber: user.phoneNumber || '',
        preferredLanguage: 'en',
      })
    }
  }, [customerData, user, form]);

  // --- Submission Handler ---
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !auth.currentUser || !customerData) {
        toast({ variant: 'destructive', title: t('error'), description: t('must_be_logged_in')});
        return;
    }
    
    setIsSubmitting(true);

    try {
        const newDisplayName = `${values.firstName} ${values.lastName}`;
        // 1. Update Auth Profile
        if (auth.currentUser.displayName !== newDisplayName) {
            await updateProfile(auth.currentUser, {
                displayName: newDisplayName
            });
        }


        // 2. Update Firestore Document
        const customerRef = doc(firestore, "customers", user.uid);
        updateDocumentNonBlocking(customerRef, {
            firstName: values.firstName,
            lastName: values.lastName,
            phoneNumber: values.phoneNumber,
            preferredLanguage: values.preferredLanguage,
            role: customerData.role,
        });
        
        // 3. Update Language context immediately
        setLocale(values.preferredLanguage as Locale);

        toast({
            title: t('profile_updated_success_title'),
            description: t('profile_updated_success_desc'),
        });
    } catch (error) {
        console.error("Profile update error: ", error);
        toast({
            variant: "destructive",
            title: t('profile_update_error_title'),
            description: t('profile_update_error_desc'),
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  // --- Loading and Auth checks ---
  const isLoading = isUserLoading || isCustomerLoading;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>{t('my_profile')}</CardTitle>
                <CardDescription>{t('my_profile_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('first_name')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('first_name')} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                             <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('last_name')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('last_name')} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>

                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('email')}</FormLabel>
                                <FormControl>
                                    <Input disabled {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        
                         <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('phone_number')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('phone_number')} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        
                        <FormField
                            control={form.control}
                            name="preferredLanguage"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Preferred Language</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your preferred language" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="ar">العربية</SelectItem>
                                    <SelectItem value="ru">Русский</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isAdmin && customerData?.role && (
                          <FormItem>
                            <FormLabel>{t('role')}</FormLabel>
                            <Input disabled value={t(customerData.role)} />
                          </FormItem>
                        )}
                        
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('update_profile')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
