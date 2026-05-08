'use client';

import { useLanguage } from '@/context/language-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Locale } from '@/lib/types';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const handleValueChange = (value: string) => {
    setLocale(value as Locale);
  };

  return (
    <Select value={locale} onValueChange={handleValueChange}>
      <SelectTrigger className="w-auto gap-2 border-0 bg-transparent shadow-none hover:bg-accent focus:ring-0">
        <Globe className="h-5 w-5" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ar">العربية</SelectItem>
        <SelectItem value="ru">Русский</SelectItem>
      </SelectContent>
    </Select>
  );
}
