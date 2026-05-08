'use client';

import { useParams, useRouter, notFound } from 'next/navigation';
import { useDoc, useUser, useMemoFirebase } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { doc, DocumentReference } from 'firebase/firestore';
import type { Order, OrderItem, LocalizedString } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ar, enUS, ru } from 'date-fns/locale';
import { useEffect } from 'react';

function OrderDetailsLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-16 w-16 text-primary animate-spin" />
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { t, locale } = useLanguage();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/my-account/orders');
    }
  }, [isUserLoading, user, router]);

  // The query is now conditional on the user being loaded and points to the subcollection
  const orderRef = useMemoFirebase(() => {
    if (!orderId || !firestore || !user) return null;
    return doc(firestore, 'customers', user.uid, 'orders', orderId) as DocumentReference<Order>;
  }, [firestore, user, orderId]);

  const { data: order, isLoading: isOrderLoading } = useDoc<Order>(orderRef);
  
  const dateLocale = { en: enUS, ar, ru }[locale];

  const OrderItemRow = ({ item }: { item: OrderItem }) => {
    const itemName = (name: LocalizedString, currentLocale: 'en' | 'ar' | 'ru') => {
        return name[currentLocale] || name['en'];
    };

    return (
        <div className="flex justify-between items-center py-3">
            <div>
                <p className="font-semibold">{itemName(item.name, locale)}</p>
                <p className="text-sm text-muted-foreground">
                    {t('quantity')}: {item.quantity}
                </p>
            </div>
            <p className="font-medium">{(item.price * item.quantity).toFixed(2)} {t('currency')}</p>
        </div>
    )
  }

  const isLoading = isUserLoading || isOrderLoading;

  if (isLoading || !user) {
    return <OrderDetailsLoading />;
  }
  
  // This is a definitive check. If we are finished loading and still have no order, it's a 404.
  if (!order) {
    notFound();
  }
  
  // Security check: The query itself is secure now, but this is a good UI pattern
  if (user.uid !== order.userId) {
     return (
        <Alert variant="destructive" className="max-w-lg mx-auto">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>{t('access_denied')}</AlertTitle>
            <AlertDescription>{t('order_not_yours')}</AlertDescription>
        </Alert>
    );
  }

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
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                        <CardTitle className="mb-1">{t('order_details_title')}</CardTitle>
                        <CardDescription>
                            #{order.id} &bull; {order.createdAt ? format(order.createdAt.toDate(), 'PPP', { locale: dateLocale }) : ''}
                        </CardDescription>
                        {order.createdAt && (
                            <p className="font-medium text-base">{format(order.createdAt.toDate(), 'p', { locale: dateLocale })}</p>
                        )}
                    </div>
                    <div className="mt-4 md:mt-0 text-left md:text-right">
                        <p className="text-sm font-medium text-muted-foreground mb-1">{t('order_status')}</p>
                        <Badge variant={getStatusVariant(order.status)} className="text-sm">{t(order.status)}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold mb-3">{t('items')} ({order.items.length})</h3>
                        <Separator />
                        <div className="divide-y">
                            {order.items.map((item, index) => (
                                <OrderItemRow key={`${item.id}-${index}`} item={item} />
                            ))}
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-lg pt-4">
                            <span>{t('total_price')}</span>
                            <span>{order.totalPrice.toFixed(2)} {t('currency')}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3">{t('shipping_address')}</h3>
                        <div className="text-muted-foreground space-y-1">
                            <p>{order.customerDetails.fullName}</p>
                            <p>{order.customerDetails.address}</p>
                            <p>{order.customerDetails.phone}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
