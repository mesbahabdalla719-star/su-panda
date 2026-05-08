'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { useUser, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Order } from '@/lib/types';
import { Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ar, enUS, ru } from 'date-fns/locale';

function OrdersLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-16 w-16 text-primary animate-spin" />
    </div>
  );
}

function MyOrdersContent() {
  const { t, locale } = useLanguage();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const dateLocale = { en: enUS, ar, ru }[locale];

  const searchParams = useSearchParams();
  const initialSearchTerm = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // ✅ Only create query when user is loaded, now pointing to the secure subcollection
  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;

    return query(
      collection(firestore, 'customers', user.uid, 'orders'), // ✅ Correct subcollection
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: orders, isLoading: isOrdersLoading, error } = useCollection<Order>(ordersQuery);

  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/my-account/orders');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !ordersQuery || isOrdersLoading) {
    return <OrdersLoadingSkeleton />;
  }

  if (error) {
    console.error('Error fetching user orders:', error);
    return <p className="text-destructive">Error loading orders: {error.message}</p>;
  }

  const filteredOrders =
    orders?.filter(order => {
      if (searchTerm === '') return true;
      const lower = searchTerm.toLowerCase();

      if (order.id.toLowerCase().includes(lower)) return true;
      if (order.items.some(item => (item.name[locale] || item.name['en']).toLowerCase().includes(lower))) return true;

      return false;
    }) || [];

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'preparing': return 'default';
      case 'done': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <CardTitle>{t('my_orders')}</CardTitle>
            <CardDescription>{t('my_orders_subtitle')}</CardDescription>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('search_my_orders_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('order')} #</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('total_price')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 7)}...</TableCell>
                  <TableCell>
                    {order.createdAt ? format(order.createdAt.toDate(), 'PPP', { locale: dateLocale }) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>{t(order.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {order.totalPrice.toFixed(2)} {t('currency')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/my-account/orders/${order.id}`}>{t('view_details')}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">
              {t('no_orders_yet')}
            </p>
            <Button asChild>
              <Link href="/">{t('order_now')}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense fallback={<OrdersLoadingSkeleton />}>
      <MyOrdersContent />
    </Suspense>
  );
}
