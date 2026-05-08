'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { Send } from 'lucide-react';
import { FaWhatsapp } from "react-icons/fa";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from './ui/button';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} {t('logo_text')}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="link" className="text-muted-foreground hover:text-foreground p-0 h-auto text-sm font-normal">
                    {t('medical_disclaimer_button')}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('medical_disclaimer_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('medical_disclaimer_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>{t('ok')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
                
                <span className="text-muted-foreground">|</span>

                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                    {t('contact_us')}
                </Link>
            </div>
            <div className="flex items-center gap-4">
                <a href="https://wa.me/79960667962" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <FaWhatsapp className="h-6 w-6" />
                </a>
                <a href="https://t.me/Abdo2362" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Send className="h-6 w-6" />
                </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
