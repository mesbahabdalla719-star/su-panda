'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Menu, X, Calculator, User, LogOut, Home, MessageSquare, Shield, Info, Mail, History, LifeBuoy, Settings as SettingsIcon, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { useFavorites } from '@/context/favorites-context';
import { useNutrition } from '@/context/nutrition-context';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import LanguageSwitcher from './language-switcher';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from './ui/sheet';
import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ThemeSwitcher } from './theme-switcher';
import { useAdmin } from '@/hooks/use-admin';


// Base links for navigation
const navLinks = [
  { href: '/', labelKey: 'home', icon: Home },
  { href: '/about', labelKey: 'about_us', icon: Info },
  { href: '/calculator', labelKey: 'calculator', icon: Calculator },
  { href: '/testimonials', labelKey: 'testimonials', icon: MessageSquare },
  { href: '/contact', labelKey: 'contact_us', icon: Mail },
];

// Additional links for mobile menu
const mobileOnlyLinks = [
  { href: '/cart', labelKey: 'cart', icon: ShoppingCart },
  { href: '/favorites', labelKey: 'favorites', icon: Heart },
];

export default function Header() {
  const { t, direction } = useLanguage();
  const { cartCount, clearCart } = useCart();
  const { favoritesCount, clearFavorites } = useFavorites();
  const { clearAllNutrition } = useNutrition();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { auth } = useFirebase();
  const { user, isUserLoading, isSuperAdmin, isAdmin, isStaff } = useAdmin();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      // Clear all user-specific data from contexts
      clearCart();
      clearFavorites();
      clearAllNutrition();
      // Redirect to home page after logout
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const NavLinkItems = ({ isMobile = false }: { isMobile?: boolean }) => {
    const linksToRender = isMobile ? [...navLinks, ...mobileOnlyLinks] : navLinks;

    return linksToRender.map(({ href, labelKey, icon: Icon }) => {
      // Mobile version with icons
      if (isMobile) {
        return (
          <SheetClose asChild key={href}>
            <Link
            href={href}
            onClick={() => setIsMenuOpen(false)}
            className={cn(
                'flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground',
                pathname === href && 'text-foreground font-semibold',
                'block py-2 md:py-0 text-lg md:text-sm'
            )}
            >
            <Icon className="h-5 w-5" />
            {isMounted ? t(labelKey) : <>&nbsp;</>}
            </Link>
          </SheetClose>
        );
      }
      
      // Desktop version (text only with hover effect)
      const isActive = pathname === href;
      return (
        <Link
            key={href}
            href={href}
            className={cn(
                'group relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-2',
                isActive && 'text-foreground'
            )}
            >
            {isMounted ? t(labelKey) : <>&nbsp;</>}
            <span
                className={cn(
                'absolute -bottom-0.5 left-0 h-0.5 w-full bg-primary transform transition-transform duration-300 ease-out',
                isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                direction === 'rtl' ? 'origin-right' : 'origin-left'
                )}
            />
        </Link>
      );
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left group: logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2 group">
              <Image src='https://i.postimg.cc/c1vHwDHM/5413533022658694454.jpg' alt='Su Panda Logo' width={40} height={40} className="rounded-full transition-transform duration-300 group-hover:rotate-[-15deg] group-hover:scale-125" />
              <span className="hidden font-bold text-lg sm:inline-block font-headline transition-colors group-hover:text-primary">{isMounted ? t('logo_text') : <>&nbsp;</>}</span>
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <NavLinkItems />
          </nav>
        </div>
        
        {/* Right group: all icons */}
        <div className="flex items-center justify-end space-x-1 md:space-x-2">
          <ThemeSwitcher />
          <LanguageSwitcher />

          <div className="hidden md:flex items-center gap-1">
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button asChild variant="ghost" size="icon" className="relative">
                          <Link href="/cart">
                              <ShoppingCart className="h-5 w-5" />
                              <span className="sr-only">{isMounted ? t('cart') : <>&nbsp;</>}</span>
                              {cartCount > 0 && (
                                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs border-2 border-background">
                                      {cartCount}
                                  </Badge>
                              )}
                          </Link>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>{isMounted ? t('shopping_cart') : <>&nbsp;</>}</p>
                  </TooltipContent>
              </Tooltip>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button asChild variant="ghost" size="icon" className="relative">
                          <Link href="/favorites">
                              <Heart className="h-5 w-5" />
                              <span className="sr-only">{isMounted ? t('favorites') : <>&nbsp;</>}</span>
                              {favoritesCount > 0 && (
                                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs border-2 border-background">
                                      {favoritesCount}
                                  </Badge>
                              )}
                          </Link>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>{isMounted ? t('my_favorites') : <>&nbsp;</>}</p>
                  </TooltipContent>
              </Tooltip>
          </div>
          
          <div className="hidden md:block h-6 w-px bg-border mx-2" />

          {isUserLoading ? (
             <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(isSuperAdmin || isAdmin) ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/my-account/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>{isMounted ? t('my_profile') : <>&nbsp;</>}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>{isMounted ? t('admin_dashboard') : <>&nbsp;</>}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : isStaff ? (
                   <>
                    <DropdownMenuItem asChild>
                      <Link href="/my-account/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>{isMounted ? t('my_profile') : <>&nbsp;</>}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/staff/orders">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>{isMounted ? t('staff_dashboard') : <>&nbsp;</>}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href="/my-account/profile">
                            <User className="mr-2 h-4 w-4" />
                            <span>{isMounted ? t('my_profile') : <>&nbsp;</>}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/my-account/orders">
                            <History className="mr-2 h-4 w-4" />
                            <span>{isMounted ? t('my_orders') : <>&nbsp;</>}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/favorites">
                            <Heart className="mr-2 h-4 w-4" />
                            <span>{isMounted ? t('my_favorites') : <>&nbsp;</>}</span>
                          </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href="/contact">
                            <LifeBuoy className="mr-2 h-4 w-4" />
                            <span>{isMounted ? t('support') : <>&nbsp;</>}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/my-account/profile">
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            <span>{isMounted ? t('settings') : <>&nbsp;</>}</span>
                          </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isMounted ? t('logout') : <>&nbsp;</>}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost">
                    <Link href="/login">{isMounted ? t('login') : <>&nbsp;</>}</Link>
                </Button>
            </div>
          )}


          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={direction === 'rtl' ? 'right' : 'left'}>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex flex-col h-full">
                   <div className="flex items-center justify-between pb-4 border-b">
                     <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                      <Image src='https://i.postimg.cc/c1vHwDHM/5413533022658694454.jpg' alt='Su Panda Logo' width={32} height={32} className="rounded-full" />
                      <span className="font-bold font-headline">{isMounted ? t('logo_text') : <>&nbsp;</>}</span>
                    </Link>
                    <SheetClose asChild>
                       <Button variant="ghost" size="icon">
                         <X className="h-5 w-5" />
                         <span className="sr-only">Close menu</span>
                       </Button>
                    </SheetClose>
                  </div>
                  <nav className="flex flex-col gap-4 mt-6">
                    <NavLinkItems isMobile={true} />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
