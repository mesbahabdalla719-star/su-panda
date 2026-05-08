'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Beef, Sparkles, Flame, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNutrition } from '@/context/nutrition-context';
import { Progress } from '@/components/ui/progress';

export function NutritionCalculator() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { history, addNutritionEntry, clearNutritionForDate, getTotalsForDate } = useNutrition();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentInputs, setCurrentInputs] = useState({ protein: '', sugar: '', calories: '' });

  const totalsForSelectedDate = getTotalsForDate(selectedDate) || { protein: 0, sugar: 0, calories: 0 };
  
  const dailyGoals = { protein: 75, sugar: 30, calories: 2000 };

  const proteinProgress = Math.min((totalsForSelectedDate.protein / dailyGoals.protein) * 100, 100);
  const sugarProgress = Math.min((totalsForSelectedDate.sugar / dailyGoals.sugar) * 100, 100);
  const caloriesProgress = Math.min((totalsForSelectedDate.calories / dailyGoals.calories) * 100, 100);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    const protein = parseFloat(currentInputs.protein) || 0;
    const sugar = parseFloat(currentInputs.sugar) || 0;
    const calories = parseFloat(currentInputs.calories) || 0;

    if (protein === 0 && sugar === 0 && calories === 0) {
      return;
    }
    
    addNutritionEntry({ protein, sugar, calories }, selectedDate);
    setCurrentInputs({ protein: '', sugar: '', calories: '' });

    toast({
      title: t('nutrients_added'),
      description: `${t('protein')}: ${protein}g, ${t('sugar')}: ${sugar}g, ${t('calories')}: ${calories}`,
    });
  };

  const handleClear = () => {
     clearNutritionForDate(selectedDate);
     toast({
      title: t('totals_cleared'),
      description: t('daily_totals_reset'),
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('add_nutrients')}</CardTitle>
            <CardDescription>{t('add_nutrients_desc')} {format(selectedDate, 'PPP')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Beef className="h-6 w-6 text-primary" />
              <Input
                type="number"
                name="protein"
                placeholder={t('protein_grams')}
                value={currentInputs.protein}
                onChange={handleInputChange}
                aria-label={t('protein_grams')}
              />
            </div>
            <div className="flex items-center gap-4">
              <Sparkles className="h-6 w-6 text-destructive" />
              <Input
                type="number"
                name="sugar"
                placeholder={t('sugar_grams')}
                value={currentInputs.sugar}
                onChange={handleInputChange}
                aria-label={t('sugar_grams')}
              />
            </div>
            <div className="flex items-center gap-4">
              <Flame className="h-6 w-6 text-accent" />
              <Input
                type="number"
                name="calories"
                placeholder={t('calories_value')}
                value={currentInputs.calories}
                onChange={handleInputChange}
                aria-label={t('calories_value')}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAdd} className="w-full">
              <Plus className="mr-2 h-5 w-5" />
              {t('add_to_total')}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>{t('daily_total')}</CardTitle>
             <CardDescription>{t('daily_goals')} - {format(selectedDate, 'PPP')}</CardDescription>
          </CardHeader>
           <CardContent className="space-y-4">
                {/* Protein */}
                <div>
                    <div className="flex justify-between items-end mb-1 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            <Beef className="h-5 w-5 text-primary" />
                            <span>{t('protein')}</span>
                        </div>
                        <span className="font-semibold">
                            {(totalsForSelectedDate?.protein || 0).toFixed(1)}
                            <span className="text-xs text-muted-foreground"> / {dailyGoals.protein}g</span>
                        </span>
                    </div>
                    <Progress value={proteinProgress} className="h-3" />
                </div>
                {/* Sugar */}
                <div>
                    <div className="flex justify-between items-end mb-1 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            <Sparkles className="h-5 w-5 text-destructive" />
                            <span>{t('sugar')}</span>
                        </div>
                        <span className="font-semibold">
                            {(totalsForSelectedDate?.sugar || 0).toFixed(1)}
                            <span className="text-xs text-muted-foreground"> / {dailyGoals.sugar}g</span>
                        </span>
                    </div>
                    <Progress value={sugarProgress} className="h-3 [&>div]:bg-destructive" />
                </div>
                {/* Calories */}
                <div>
                    <div className="flex justify-between items-end mb-1 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            <Flame className="h-5 w-5 text-accent" />
                            <span>{t('calories')}</span>
                        </div>
                        <span className="font-semibold">
                            {(totalsForSelectedDate?.calories || 0).toFixed(0)}
                            <span className="text-xs text-muted-foreground"> / {dailyGoals.calories}</span>
                        </span>
                    </div>
                    <Progress value={caloriesProgress} className="h-3 [&>div]:bg-accent" />
                </div>
            </CardContent>
          <CardFooter>
            <Button onClick={handleClear} variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-5 w-5" />
              {t('clear_total')}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('monthly_overview')}</CardTitle>
          <CardDescription>{t('monthly_overview_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="p-0"
            modifiers={{
              hasData: Object.keys(history).map(dateStr => new Date(dateStr))
            }}
            modifiersStyles={{
              hasData: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: 'hsl(var(--primary))',
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
