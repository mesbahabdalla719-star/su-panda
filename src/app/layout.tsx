import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { cn } from '@/lib/utils';
import { FloatingCartButton } from '@/components/floating-cart-button';

export const metadata: Metadata = {
  title: 'Su Panda',
  description: 'Delicious and healthy meals for diabetics.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@300;400;500;700&family=Alegreya:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased')} suppressHydrationWarning>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </div>
          <FloatingCartButton />
        </Providers>
      </body>
    </html>
  );
}