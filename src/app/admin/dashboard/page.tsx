'use client';

import { useLanguage } from '@/context/language-context';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Package, Hourglass, ShoppingBag, ShieldAlert, AlertCircle, RefreshCcw } from 'lucide-react';
import type { Order } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar, enUS, ru } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';

function StatCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode, description?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
}

function RevenueChart({ data, t }: { data: { name: string; total: number }[], t: (key: string) => string; }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="total" name={t('revenue') || 'Revenue'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default function DashboardPage() {
    const { t, locale } = useLanguage();
    const { isSuperAdmin, isLoading: isAdminLoading } = useAdmin();
    const { firestore } = useFirebase();

    const ordersQuery = useMemoFirebase(() => {
        if (!isSuperAdmin || !firestore) return null;
        return query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
    }, [isSuperAdmin, firestore]);

    const { data: orders, isLoading: isOrdersLoading, error } = useCollection<Order>(ordersQuery);

    const isLoading = isAdminLoading || (isSuperAdmin && isOrdersLoading);

    if (isLoading) {
        return (
            <div className="space-y-6">
                 <h2 className="text-3xl font-bold tracking-tight">{t('admin_dashboard')}</h2>
                 <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </div>
            </div>
        );
    }
    
    if (!isSuperAdmin) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">{t('admin_dashboard')}</h2>
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="h-5 w-5" />
                            {t('access_denied')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t('no_admin_permission')}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        const isIndexError = error.message.toLowerCase().includes('index');
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">{t('admin_dashboard')}</h2>
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            {isIndexError ? 'Database Index Required' : 'Data Access Error'}
                        </CardTitle>
                        <CardDescription>
                            {isIndexError 
                                ? 'A Firestore composite index is required for this dashboard to work.' 
                                : 'There was a problem loading the dashboard data.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm font-mono bg-muted p-3 rounded border break-all">{error.message}</p>
                        {isIndexError && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground italic">
                                    <strong>Solution:</strong> Look at your browser console (press F12). Firebase will have printed a link that you can click to automatically create the required index in the Firebase Console.
                                </p>
                                <Button onClick={() => window.location.reload()} variant="outline">
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Reload Page after Indexing
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const ordersData = orders || [];
    const totalRevenue = ordersData.reduce((acc, order) => acc + (order.status !== 'cancelled' ? (order.totalPrice || 0) : 0), 0);
    const totalOrders = ordersData.length;
    const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
    const preparingOrders = ordersData.filter(o => o.status === 'preparing').length;
    const recentOrders = ordersData.slice(0, 5);

    const getRevenueLast7Days = () => {
        const revenueByDay: { [key: string]: number } = {};
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = format(date, 'EEE');
            revenueByDay[dateString] = 0;
        }

        ordersData.forEach(order => {
            if (order.createdAt && typeof order.createdAt.toDate === 'function' && order.status !== 'cancelled') {
                const orderDate = order.createdAt.toDate();
                const diffDays = (today.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
                if (diffDays < 7) {
                    const dayName = format(orderDate, 'EEE');
                    revenueByDay[dayName] = (revenueByDay[dayName] || 0) + (order.totalPrice || 0);
                }
            }
        });

        return Object.keys(revenueByDay).map(day => ({ name: day, total: revenueByDay[day] })).reverse();
    };

    const revenueData = getRevenueLast7Days();

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
            <h2 className="text-3xl font-bold tracking-tight">{t('admin_dashboard')}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title={t('total_revenue')} value={`${totalRevenue.toFixed(2)} ${t('currency')}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title={t('total_orders')} value={`+${totalOrders}`} icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title={t('pending_orders')} value={`${pendingOrders}`} icon={<Hourglass className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title={t('in_preparation')} value={`${preparingOrders}`} icon={<Package className="h-4 w-4 text-muted-foreground" />} />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>{t('revenue_last_7_days')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RevenueChart data={revenueData} t={t} />
                    </CardContent>
                </Card>
                 <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{t('recent_orders')}</CardTitle>
                        <CardDescription>
                            Showing the most recent activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length > 0 ? (
                            <div className="space-y-4">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="flex items-center">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{order.customerDetails.fullName}</p>
                                            <p className="text-xs text-muted-foreground">{order.customerDetails.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm">+{ (order.totalPrice || 0).toFixed(2)} {t('currency')}</p>
                                            <Badge variant={getStatusVariant(order.status)} className="text-[10px] h-5">{t(order.status)}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-10">No recent orders.</p>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}