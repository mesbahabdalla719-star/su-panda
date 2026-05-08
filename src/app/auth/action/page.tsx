'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { applyActionCode, checkActionCode, confirmPasswordReset } from 'firebase/auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

function ActionHandler() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { auth } = useFirebase();
  const { toast } = useToast();

  const [mode, setMode] = useState<string | null>(null);
  const [actionCode, setActionCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'form'>('loading');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordFormSchema = z.object({
    password: z.string().min(6, { message: t('password_min_length_error') }),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: t('password_mismatch_error'),
    path: ['confirmPassword'],
  });

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  
  useEffect(() => {
    // This effect should only run once auth is available.
    if (!auth) {
      return;
    }

    const currentMode = searchParams.get('mode');
    const currentActionCode = searchParams.get('oobCode');

    if (!currentMode || !currentActionCode) {
      setStatus('error');
      setMessage(t('invalid_link_error'));
      return;
    }
    
    setMode(currentMode);
    setActionCode(currentActionCode);

    const handleAction = async () => {
      try {
        switch (currentMode) {
          case 'resetPassword':
            // Verify the code is valid before showing the form.
            await checkActionCode(auth, currentActionCode);
            setStatus('form');
            setMessage(t('reset_your_password'));
            break;
          case 'verifyEmail':
            // Apply the verification code immediately.
            await applyActionCode(auth, currentActionCode);
            setStatus('success');
            setMessage(t('email_verified_success'));
            toast({ title: t('success'), description: t('email_verified_success') });
            // Redirect to login after a short delay so the user can see the message.
            setTimeout(() => router.push('/login'), 3000);
            break;
          default:
            setStatus('error');
            setMessage(t('unsupported_action_error'));
            break;
        }
      } catch (error) {
        setStatus('error');
        setMessage(t('invalid_or_expired_link_error'));
        console.error("Action code error:", error);
      }
    };

    handleAction();
  // We only want this to run when `auth` becomes available, not on every param change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);


  async function onPasswordResetSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!actionCode || !auth) return;
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, actionCode, values.password);
      setStatus('success');
      setMessage(t('password_reset_success'));
      toast({ title: t('success'), description: t('password_reset_success_desc') });
      setTimeout(() => router.push('/login'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage(t('password_reset_failed_generic'));
      toast({ variant: 'destructive', title: t('error'), description: t('password_reset_failed_generic') });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="sr-only">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
            {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-green-500" />}
            {status === 'error' && <XCircle className="mx-auto h-12 w-12 text-destructive" />}
            <CardTitle className="text-2xl font-bold">{t('auth_action_title')}</CardTitle>
            <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
            {status === 'form' && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onPasswordResetSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('new_password')}</FormLabel>
                                <div className="relative">
                                <FormControl>
                                    <Input type={showPassword ? 'text' : 'password'} {...field} />
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
                        <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('confirm_password')}</FormLabel>
                                <div className="relative">
                                <FormControl>
                                    <Input type={showConfirmPassword ? 'text' : 'password'} {...field} />
                                </FormControl>
                                 <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('save_new_password')}
                        </Button>
                    </form>
                </Form>
            )}
            {(status === 'success' || status === 'error') && (
                <div className="text-center">
                    <Button asChild>
                        <Link href="/login">{t('back_to_login')}</Link>
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="sr-only">Loading page...</p>
      </div>
    }>
      <ActionHandler />
    </Suspense>
  );
}
