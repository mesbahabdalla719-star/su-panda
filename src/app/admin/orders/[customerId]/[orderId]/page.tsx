'use client';

import { useParams, notFound } from 'next/navigation';
import { useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { doc, DocumentReference } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar, enUS, ru } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


function OrderDetailsLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-16 w-16 text-primary animate-spin" />
    </div>
  );
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const customerId = Array.isArray(params.customerId) ? params.customerId[0] : params.customerId;
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  
  const { firestore } = useFirebase();
  const { t, locale } = useLanguage();
  const { toast } = useToast();

  const orderRef = useMemoFirebase(() => {
    if (!orderId || !customerId || !firestore) return null;
    return doc(firestore, 'customers', customerId, 'orders', orderId) as DocumentReference<Order>;
  }, [firestore, customerId, orderId]);

  const { data: order, isLoading: isOrderLoading } = useDoc<Order>(orderRef);
  
  const dateLocale = { en: enUS, ar, ru }[locale];

  if (isOrderLoading) {
    return <OrderDetailsLoading />;
  }
  
  if (!orderId || !order) {
    notFound();
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

  const handleStatusChange = (newStatus: Order['status']) => {
    if (!firestore || !orderRef) return;
    updateDocumentNonBlocking(orderRef, { status: newStatus });
    toast({
      title: t('order_status_updated'),
      description: `${t('order')} #${order.id.slice(0, 6)}... ${t('is_now')} ${t(newStatus)}.`,
    });
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
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
                        <p className="text-sm font-medium text-muted-foreground mb-2">{t('update_status')}</p>
                        <Select
                          defaultValue={order.status}
                          onValueChange={(value) => handleStatusChange(value as Order['status'])}
                        >
                          <SelectTrigger className="w-[180px]">
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
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <h3 className="font-semibold mb-3">{t('items')} ({order.items.length})</h3>
                        <div className="border rounded-md">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>{t('item')}</TableHead>
                                      <TableHead className="text-center">{t('quantity')}</TableHead>
                                      <TableHead className="text-right">{t('price')}</TableHead>
                                      <TableHead className="text-right">{t('total')}</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {order.items.map((item, index) => {
                                      const itemName = item.name[locale] || item.name['en'];
                                      const itemTotal = item.price * item.quantity;
                                      return (
                                          <TableRow key={`${item.id}-${index}`}>
                                              <TableCell className="font-medium">{itemName}</TableCell>
                                              <TableCell className="text-center">{item.quantity}</TableCell>
                                              <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                                              <TableCell className="text-right font-semibold">{itemTotal.toFixed(2)}</TableCell>
                                          </TableRow>
                                      )
                                  })}
                              </TableBody>
                          </Table>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex justify-end items-center font-bold text-lg pt-4">
                            <span className='mr-4'>{t('total_price')}:</span>
                            <span>{order.totalPrice.toFixed(2)} {t('currency')}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3">{t('shipping_address')}</h3>
                        <div className="text-muted-foreground space-y-1 bg-muted/50 p-4 rounded-md">
                            <p className='font-semibold text-foreground'>{order.customerDetails.fullName}</p>
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
