'use client';

import { useLanguage } from '@/context/language-context';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Package, Hourglass, ShoppingBag, ShieldAlert } from 'lucide-react';
import type { Order } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar, enUS, ru } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAdmin } from '@/hooks/use-admin';

// Helper components are defined here for clarity within the single-file structure.

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
                <Legend />
                <Bar dataKey="total" name={t('revenue')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default function DashboardPage() {
    const { t, locale } = useLanguage();
    const { isSuperAdmin, isLoading: isAdminLoading } = useAdmin();
    const { firestore } = useFirebase();
    const dateLocale = { en: enUS, ar, ru }[locale];

    // Make the query creation dependent on isSuperAdmin being true and firestore being available.
    // This prevents running the query prematurely.
    const ordersQuery = useMemoFirebase(() => {
        if (!isSuperAdmin || !firestore) return null;
        return query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
    }, [isSuperAdmin, firestore]);

    const { data: orders, isLoading: isOrdersLoading, error } = useCollection<Order>(ordersQuery);

    // The final loading state depends on both the admin check and the orders loading.
    const isLoading = isAdminLoading || (isSuperAdmin && isOrdersLoading);

    // Display a loading spinner while checking permissions or fetching data.
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
    
    // After loading, if the user is not a super admin, show access denied.
    if (!isSuperAdmin) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">{t('admin_dashboard')}</h2>
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
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
        return <p className="text-destructive col-span-full">Error loading orders: {error.message}</p>;
    }
    
    if (!orders || orders.length === 0) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">{t('admin_dashboard')}</h2>
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>No Orders Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>No orders have been placed in the system yet.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- All checks passed, we have admin access and orders data ---
    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
          case 'pending': return 'secondary';
          case 'preparing': return 'default';
          case 'done': return 'default';
          case 'cancelled': return 'destructive';
          default: return 'outline';
        }
    };

    const totalRevenue = orders.reduce((acc, order) => acc + (order.status !== 'cancelled' ? order.totalPrice : 0), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const recentOrders = orders.slice(0, 5);

    const getRevenueLast7Days = () => {
        const revenueByDay: { [key: string]: number } = {};
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = format(date, 'EEE');
            revenueByDay[dateString] = 0;
        }

        orders.forEach(order => {
            if (order.createdAt && order.status !== 'cancelled') {
                const orderDate = order.createdAt.toDate();
                const diffDays = (today.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
                if (diffDays < 7) {
                    const dayName = format(orderDate, 'EEE');
                    revenueByDay[dayName] = (revenueByDay[dayName] || 0) + order.totalPrice;
                }
            }
        });

        return Object.keys(revenueByDay).map(day => ({ name: day, total: revenueByDay[day] })).reverse();
    };

    const revenueData = getRevenueLast7Days();

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
                            {t('recent_orders_desc', { count: pendingOrders })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOrders.map(order => (
                                <div key={order.id} className="flex items-center">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{order.customerDetails.fullName}</p>
                                        <p className="text-sm text-muted-foreground">{order.customerDetails.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">+{order.totalPrice.toFixed(2)} {t('currency')}</p>
                                        <Badge variant={getStatusVariant(order.status)}>{t(order.status)}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
