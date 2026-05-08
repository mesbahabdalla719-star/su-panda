'use client';

import { useLanguage } from '@/context/language-context';
import { useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, collectionGroup } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar, enUS, ru } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function OrdersLoadingSkeleton() {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
}

function StaffOrdersTable() {
  const { t, locale } = useLanguage();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const dateLocale = { en: enUS, ar, ru }[locale];

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: orders, isLoading, error } = useCollection<Order>(ordersQuery);

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'customers', order.userId, 'orders', order.id);
    updateDocumentNonBlocking(orderRef, { status: newStatus });
    toast({
      title: t('order_status_updated'),
      description: `${t('order')} #${order.id.slice(0, 6)}... ${t('is_now')} ${t(newStatus)}.`,
    });
  };

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'preparing': return 'default';
      case 'done': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <OrdersLoadingSkeleton />;
  }

  if (error) {
    return <p className="text-destructive">{t('orders_load_error')}: {error.message}</p>;
  }

  const activeOrders = orders?.filter(o => o.status === 'pending' || o.status === 'preparing');

  return (
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>{t('customer')}</TableHead>
          <TableHead>{t('date')}</TableHead>
          <TableHead>{t('status')}</TableHead>
          <TableHead className="text-right">{t('total_price')}</TableHead>
          <TableHead className="text-right">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activeOrders && activeOrders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id.slice(0, 6)}...</TableCell>
            <TableCell>{order.customerDetails.fullName}</TableCell>
            <TableCell>{order.createdAt ? format(order.createdAt.toDate(), 'PPP', { locale: dateLocale }) : ''}</TableCell>
            <TableCell>
              <Select
                defaultValue={order.status}
                onValueChange={(value) => handleStatusChange(order, value as Order['status'])}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue asChild>
                      <Badge variant={getStatusVariant(order.status)}>{t(order.status)}</Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="preparing">{t('preparing')}</SelectItem>
                  <SelectItem value="done">{t('done')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-right">{order.totalPrice.toFixed(2)} {t('currency')}</TableCell>
            <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                    {/* Note: This links to the admin details page, which staff should have access to. */}
                    <Link href={`/admin/orders/${order.userId}/${order.id}`}>
                        {t('view_details')}
                    </Link>
                </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


export default function StaffAllOrdersPage() {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('orders')}</CardTitle>
        <CardDescription>View and manage active orders that need preparation.</CardDescription>
      </CardHeader>
      <CardContent>
        <StaffOrdersTable />
      </CardContent>
    </Card>
  );
}
