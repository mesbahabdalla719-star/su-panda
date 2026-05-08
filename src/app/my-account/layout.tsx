'use client';

import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { User, History, Heart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const sidebarNavItems = [
    {
      title: 'my_profile',
      href: '/my-account/profile',
      icon: User,
    },
    {
      title: 'my_orders',
      href: '/my-account/orders',
      icon: History,
    },
    {
      title: 'my_favorites',
      href: '/favorites',
      icon: Heart,
    }
];

interface MyAccountLayoutProps {
  children: React.ReactNode;
}

export default function MyAccountLayout({ children }: MyAccountLayoutProps) {
    const { t } = useLanguage();
    const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-20rem)] flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside className="-mx-4 lg:w-1/5">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                      'inline-flex items-center rounded-lg p-3 text-sm font-medium hover:bg-muted',
                      pathname.startsWith(item.href) ? 'bg-muted' : 'transparent'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {t(item.title)}
                </Link>
            )
        })}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
