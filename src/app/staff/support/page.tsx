'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function SupportPage() {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('support')}</CardTitle>
        <CardDescription>{t('support_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center py-20">
         <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">{t('support_wip_title')}</h3>
        <p className="text-muted-foreground mt-2">{t('support_wip_desc')}</p>
      </CardContent>
    </Card>
  );
}
