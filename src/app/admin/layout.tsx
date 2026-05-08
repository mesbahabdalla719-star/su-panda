'use client';

import { useAdmin } from '@/hooks/use-admin';
import { useLanguage } from '@/context/language-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, LayoutDashboard, ShoppingBag, Utensils } from 'lucide-react';

const sidebarNavItems = [
  {
    title: 'dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'menu',
    href: '/admin/menu',
    icon: Utensils,
  },
  {
    title: 'orders',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
  {
    title: 'employees',
    href: '/admin/employees',
    icon: Users,
  },
];


function AdminAccessDenied() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl font-bold">{t('access_denied')}</h1>
      <p className="text-muted-foreground mt-2 mb-6">{t('no_admin_permission')}</p>
      <Button asChild>
        <Link href="/">{t('back_to_home')}</Link>
      </Button>
    </div>
  );
}

function AdminLoading() {
    return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
        </div>
    )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isLoading } = useAdmin();
  const { t } = useLanguage();
  const pathname = usePathname();

  if (isLoading) {
    return <AdminLoading />;
  }

  if (!isSuperAdmin) {
    return <AdminAccessDenied />;
  }

  return (
     <div className="flex min-h-[calc(100vh-20rem)] flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside className="-mx-4 lg:w-1/5">
        <h2 className="text-xl font-bold font-headline px-4 mb-4">{t('admin_dashboard')}</h2>
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
