'use client';

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
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { useGoogleSignIn } from "@/hooks/use-google-sign-in";
import { FaGoogle } from "react-icons/fa";

export default function SignupPage() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithGoogle, isGoogleLoading } = useGoogleSignIn();

  const formSchema = z.object({
    firstName: z.string().min(2, { message: t('first_name_error') }),
    lastName: z.string().min(2, { message: t('last_name_error') }),
    phoneNumber: z.string().min(8, { message: t('phone_number_error') }),
    email: z.string().email({ message: t('email_error_invalid') }),
    password: z.string().min(6, { message: t('password_min_length_error') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Create a document for the user in the 'customers' collection
      const customerData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        role: 'customer', // Assign default role
        preferredLanguage: locale,
      };

      await setDoc(doc(firestore, "customers", user.uid), customerData);
      
      toast({
        title: t('account_created_success_title'),
        description: t('account_created_success_desc'),
      });
      router.push('/');
      
    } catch (error) {
      let description = t('signup_failed_generic_desc');
      if (error instanceof FirebaseError) {
          switch (error.code) {
            case 'auth/email-already-in-use':
                description = t('signup_failed_email_in_use_desc');
                break;
            case 'auth/weak-password':
                description = t('password_min_length_error');
                break;
            case 'auth/operation-not-allowed':
                description = t('auth_provider_disabled_desc');
                break;
            case 'auth/internal-error':
                description = t('auth_internal_error_desc');
                break;
            default:
                description = error.message;
                break;
          }
      }
      
      toast({
        variant: "destructive",
        title: t('signup_failed_title'),
        description,
      });

    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline">{t('signup')}</h1>
        <p className="text-muted-foreground">{t('signup_subtitle')}</p>
      </div>
      <div className="bg-card p-8 rounded-lg shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('first_name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phone_number')}</FormLabel>
                  <FormControl>
                    <Input placeholder="+966 50 123 4567" {...field} />
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
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('password')}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                      />
                    </FormControl>
                     <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('signup')}
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t('or_continue_with')}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={isGoogleLoading}>
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FaGoogle className="mr-2 h-4 w-4" />}
          {t('google')}
        </Button>
        
        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            {t('has_account')}{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
