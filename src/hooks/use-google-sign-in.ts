'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, type UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import type { Customer, UserRole, Locale } from '@/lib/types';
import { FirebaseError } from 'firebase/app';


export function useGoogleSignIn() {
  const { auth, firestore } = useFirebase();
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const signInWithGoogle = async () => {
    if (!auth || !firestore) {
      console.error("Firebase auth or firestore service not available.");
      return;
    }
    
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result: UserCredential = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);
      
      const customerDocRef = doc(firestore, "customers", user.uid);
      const docSnap = await getDoc(customerDocRef);
      let userRole: UserRole = 'customer';

      if (additionalUserInfo?.isNewUser || !docSnap.exists()) {
        const nameParts = user.displayName?.split(' ') || [];
        const firstName = nameParts[0] || 'New';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        const customerData: Omit<Customer, 'id' | 'role'> & {role: UserRole} = {
            firstName,
            lastName,
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            role: 'customer' as const,
            preferredLanguage: locale,
        };
        await setDoc(customerDocRef, customerData, { merge: true });
        userRole = 'customer';
        toast({
            title: t('account_created_success_title'),
            description: t('account_created_success_desc'),
        });
      } else {
        userRole = docSnap.data()?.role || 'customer';
        toast({
            title: t('login_success_title'),
            description: t('login_success_desc'),
        });
      }

      const isSuperAdmin = user.uid === 'nWh4SGrdQYZs8wlTg1PqpXoQnB73';
      if (userRole === 'admin' || isSuperAdmin) {
          router.push('/admin/dashboard');
      } else if (userRole === 'staff') {
          router.push('/staff/orders');
      } else {
          router.push('/my-account/profile');
      }

    } catch (error) {
        if (error instanceof FirebaseError && (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request')) {
            console.log("Google Sign-In cancelled by user.");
        } else {
            console.error("Google Sign-In Error:", error);
            let description = t('google_signin_failed_generic_desc');
            if (error instanceof FirebaseError) {
                switch(error.code) {
                    case 'auth/account-exists-with-different-credential':
                        description = t('google_signin_failed_exists_desc');
                        break;
                    case 'auth/operation-not-allowed':
                        description = t('auth_provider_disabled_desc');
                        break;
                     case 'auth/internal-error':
                        description = t('auth_internal_error_desc');
                        break;
                    default:
                        break;
                }
            }
          
          toast({
            variant: "destructive",
            title: t('google_signin_failed_title'),
            description,
          });
        }
    } finally {
        setGoogleLoading(false);
    }
  };

  return { signInWithGoogle, isGoogleLoading };
}
