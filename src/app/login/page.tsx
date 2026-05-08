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
import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { useGoogleSignIn } from "@/hooks/use-google-sign-in";
import { FaGoogle } from "react-icons/fa";
import type { UserRole } from "@/lib/types";

export default function LoginPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithGoogle, isGoogleLoading } = useGoogleSignIn();

  const formSchema = z.object({
    email: z.string().email({ message: t('email_error_invalid') }),
    password: z.string().min(6, { message: t('password_min_length_error') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleRedirect = (role: UserRole, user: User) => {
    const isSuperAdmin = user.uid === 'nWh4SGrdQYZs8wlTg1PqpXoQnB73';
    if (role === 'admin' || isSuperAdmin) {
        router.push('/admin/dashboard');
    } else if (role === 'staff') {
        router.push('/staff/orders');
    } else {
        router.push('/my-account/profile');
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const customerDocRef = doc(firestore, "customers", user.uid);
      const docSnap = await getDoc(customerDocRef);
      
      let role: UserRole = 'customer';
      if (docSnap.exists() && docSnap.data().role) {
        role = docSnap.data().role;
      }

      toast({
        title: t('login_success_title'),
        description: t('login_success_desc'),
      });
      
      handleRedirect(role, user);

    } catch (error) {
       let description = t('login_failed_generic_desc');
       if (error instanceof FirebaseError) {
         switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              description = t('login_failed_invalid_credentials_desc');
              break;
            case 'auth/too-many-requests':
              description = t('login_failed_too_many_requests_desc');
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
            title: t('login_failed_title'),
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline">{t('login')}</h1>
        <p className="text-muted-foreground">{t('login_subtitle')}</p>
      </div>
      <div className="bg-card p-8 rounded-lg shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
             <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    {t('forgot_password')}
                </Link>
             </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('login')}
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
            {t('no_account')}{' '}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              {t('signup')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
