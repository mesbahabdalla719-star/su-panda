'use client';

import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';

export function PageLoadingSkeleton({ title, description }: { title: string; description: string }) {
    const { t } = useLanguage();
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </CardContent>
            </Card>
        </div>
    );
}

export function NoAccessCard() {
    const { t } = useLanguage();
    return (
        <Card>
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
    );
}
