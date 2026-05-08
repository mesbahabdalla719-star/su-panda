'use client';

import { useLanguage } from '@/context/language-context';
import Image from 'next/image';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">{t('about_us')}</h1>
        <p className="text-lg text-muted-foreground mt-2">{t('about_us_subtitle')}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg">
          <Image
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxyZXN0YXVyYW50fGVufDB8fHx8MTc2ODExODcyN3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Su Panda Restaurant"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            data-ai-hint="restaurant interior"
          />
        </div>
        <div className="space-y-4 text-muted-foreground">
          <h2 className="text-2xl font-semibold font-headline text-foreground">{t('our_story_title')}</h2>
          <p>{t('our_story_p1')}</p>
          <p>{t('our_story_p2')}</p>
          <p>{t('our_story_p3')}</p>
        </div>
      </div>
    </div>
  );
}
