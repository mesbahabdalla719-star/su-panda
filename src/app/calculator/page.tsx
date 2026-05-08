'use client';

import { NutritionCalculator } from '@/components/nutrition-calculator';
import { useLanguage } from '@/context/language-context';

export default function CalculatorPage() {
  const { t } = useLanguage();

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold font-headline">{t('nutrition_calculator')}</h1>
        <p className="text-muted-foreground">{t('nutrition_calculator_desc')}</p>
      </div>
      <NutritionCalculator />
    </div>
  );
}
