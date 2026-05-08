'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale, Customer } from '@/lib/types';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';
import ru from '@/locales/ru.json';
import { useUser, useDoc, useMemoFirebase, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type Translations = { [key: string]: string };
const translations: { [key in Locale]: Translations } = { en, ar, ru };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [isMounted, setIsMounted] = useState(false);

  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'customers', user.uid);
  }, [firestore, user?.uid]);

  const { data: customerData, isLoading: isCustomerLoading } = useDoc<Customer>(customerDocRef);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    const newDirection = newLocale === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    localStorage.setItem('locale', newLocale);
  }, []);

  // Effect to load language on initial mount
  useEffect(() => {
    // For anonymous users, or as a fallback before user data is loaded
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && ['en', 'ar', 'ru'].includes(savedLocale)) {
      setLocale(savedLocale);
    }
    setIsMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLocale]);

  // Effect to sync language from user's profile
  useEffect(() => {
    // When customer data is loaded and has a preferred language, it becomes the source of truth.
    if (customerData?.preferredLanguage) {
      setLocale(customerData.preferredLanguage);
    }
  }, [customerData, setLocale]); // This will run when data is fetched or updated.

  // Effect to apply language direction to the document
  useEffect(() => {
    if (isMounted) {
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
    }
  }, [locale, direction, isMounted]);

  const t = useCallback((key: string): string => {
    return translations[locale][key] || key;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, direction }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
