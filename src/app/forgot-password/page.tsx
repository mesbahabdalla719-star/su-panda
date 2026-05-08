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
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FirebaseError } from "firebase/app";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { auth } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    email: z.string().email({ message: t('email_error_invalid') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
    } catch (error) {
      // We only show a toast for unexpected errors (e.g. network issue),
      // not for 'user-not-found', which we handle gracefully to prevent
      // malicious users from checking which emails are registered.
      if (!(error instanceof FirebaseError && error.code === 'auth/user-not-found')) {
        console.error("Password Reset Error:", error);
        toast({
            variant: "destructive",
            title: t('password_reset_failed_title'),
            description: t('password_reset_failed_desc'),
        });
        setIsLoading(false);
        return; // Stop execution
      }
    }
    
    // This part runs on success OR if the user was not found.
    // This is a security best practice (prevents account enumeration).
    toast({
      title: t('password_reset_sent_title'),
      description: t('password_reset_sent_desc'),
    });
    // We navigate away in both cases so the user experience is identical.
    router.push('/login');
    // We might not need to set loading to false if we are navigating away,
    // but it's good practice in case navigation is slow.
    setIsLoading(false);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline">{t('forgot_password_title')}</h1>
        <p className="text-muted-foreground">{t('forgot_password_subtitle')}</p>
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

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('send_reset_link')}
            </Button>
          </form>
        </Form>

         <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            {t('remember_password')}{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
