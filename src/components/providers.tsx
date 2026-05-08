'use client';

import { LanguageProvider } from '@/context/language-context';
import { CartProvider } from '@/context/cart-context';
import { FavoritesProvider } from '@/context/favorites-context';
import { NutritionProvider } from '@/context/nutrition-context';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/context/theme-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <FirebaseClientProvider>
        <LanguageProvider>
            <CartProvider>
              <FavoritesProvider>
                <NutritionProvider>
                  <TooltipProvider>
                    {children}
                    <Toaster />
                  </TooltipProvider>
                </NutritionProvider>
              </FavoritesProvider>
            </CartProvider>
        </LanguageProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
