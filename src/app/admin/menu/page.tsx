'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { useCollection, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, DatabaseZap, Loader2 } from 'lucide-react';
import type { Dish, Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DishForm } from '@/components/admin/dish-form';
import { NoAccessCard, PageLoadingSkeleton } from '@/components/admin/common';

// Helper to generate 10 unique dishes per category (100 total)
const generateSampleDishes = () => {
    const categories: Category[] = ['breakfast', 'lunch', 'dinner', 'salads-appetizers', 'main-courses', 'snacks', 'desserts', 'hot-drinks', 'cold-drinks', 'kids-meals'];
    const dishes: any[] = [];
    
    const categoryNames: Record<string, string[]> = {
        'breakfast': ['Classic Oatmeal', 'Veggie Omelette', 'Berry Greek Yogurt', 'Avocado Toast', 'Summer Fruit Bowl', 'Protein Pancakes', 'Traditional Shakshuka', 'Egg White Burrito', 'Acai Smoothie Bowl', 'Cottage Cheese Mix'],
        'lunch': ['Grilled Chicken Salad', 'Quinoa Power Bowl', 'Turkey Club Wrap', 'Hearty Lentil Soup', 'Mediterranean Tuna', 'Beef Stir Fry', 'Chickpea Medley', 'Lemon Herb Salmon', 'Garden Veggie Plate', 'Asian Slaw'],
        'dinner': ['Baked Atlantic Cod', 'Sirloin & Broccoli', 'Zucchini Pesto Pasta', 'Rotisserie Chicken', 'Coconut Veggie Curry', 'Garlic Grilled Shrimp', 'Lamb Souvlaki', 'Mushroom Risotto', 'Eggplant Bake', 'Sesame Tofu'],
        'salads-appetizers': ['Fresh Garden Salad', 'Kale Caesar', 'Traditional Greek', 'Creamy Hummus', 'Smoky Baba Ganoush', 'Fresh Spring Rolls', 'Tomato Caprese', 'Parsley Tabbouleh', 'Vine Leaf Dolma', 'Olive Tapenade'],
        'main-courses': ['Signature Ribeye', 'Lemon Roast Chicken', 'Pan Seared Seabass', 'Spinach Lasagna', 'Traditional Beef Stew', 'Honey Glazed Salmon', 'Ratatouille', 'Chicken Tagine', 'Grilled Lamb Chops', 'Stuffed Peppers'],
        'snacks': ['Roasted Almonds', 'Green Apple Slices', 'Baby Carrots', 'Natural Popcorn', '70% Dark Cocoa', 'Brown Rice Cakes', 'Nut Trail Mix', 'Low-Fat Cheese', 'Red Seedless Grapes', 'Roasted Chickpeas'],
        'desserts': ['Mixed Berry Parfait', 'Lime Sugar-Free Jello', 'Cinnamon Baked Apple', 'Chewy Oat Cookies', 'Mango Sorbet', 'Vanilla Chia Pudding', 'Strawberry Bark', 'Almond Flour Cake', 'Poached Pears', 'Chocolate Mousse'],
        'hot-drinks': ['Premium Green Tea', 'Double Black Coffee', 'Chamomile Herbal', 'Zesty Hot Lemon', 'Warm Cinnamon', 'Refreshing Mint Tea', 'Earl Grey Classic', 'Decaf Roast', 'Ginger Spice Tea', 'Oolong Reserve'],
        'cold-drinks': ['Iced Hibiscus', 'Sparkling Lime', 'Cold Brew Nitro', 'Fresh Lemonade', 'Blueberry Smoothie', 'Matcha Iced Tea', 'Cucumber Water', 'Minty Cooler', 'Fruit Infusion', 'Detox Green Juice'],
        'kids-meals': ['Mini Chicken Sliders', 'Baked Nuggets', 'Rainbow Fruit Kabobs', 'Healthy Mac & Cheese', 'Crunchy Veggie Sticks', 'Mini Pita Pizza', 'Peanut Butter Slices', 'Berry Yogurt Tube', 'Mini Oat Pancakes', 'Mild Beef Taco']
    };

    categories.forEach(cat => {
        const names = categoryNames[cat];
        for (let i = 0; i < 10; i++) {
            const price = Math.floor(Math.random() * (1200 - 250) + 250);
            const calories = Math.floor(Math.random() * (500 - 80) + 80);
            const protein = Math.floor(Math.random() * (35 - 5) + 5);
            const sugar = Math.floor(Math.random() * (8 - 0) + 0);
            
            dishes.push({
                name: {
                    en: names[i],
                    ar: `خيار ${cat} - ${names[i]}`,
                    ru: `${names[i]} - Вариант`
                },
                description: {
                    en: `A nutritious and delicious ${cat} option, carefully prepared for diabetic health.`,
                    ar: `وجبة ${cat} صحية ولذيذة، معدة بعناية لتناسب مرضى السكري.`,
                    ru: `Питательный и вкусный вариант ${cat}, тщательно приготовленный для здоровья диабетиков.`
                },
                category: cat,
                price: price,
                calories: calories,
                protein: protein,
                sugar: sugar,
                portionSize: i % 2 === 0 ? "250g" : "300ml",
                imageId: cat.includes('drink') ? "51" : (cat.includes('salad') ? "11" : "1"),
                dailyTip: {
                    en: "Balance is key to a healthy lifestyle.",
                    ar: "التوازن هو مفتاح نمط الحياة الصحي.",
                    ru: "Баланс — залог здорового образа жизни."
                }
            });
        }
    });
    return dishes;
};

const SAMPLE_DISHES = generateSampleDishes();

export default function MenuManagementPage() {
  const { t, locale } = useLanguage();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const { isSuperAdmin, isAdmin, isLoading: isAdminLoading } = useAdmin();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState<Dish | null>(null);
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const dishesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'dishes');
  }, [firestore]);

  const { data: dishes, isLoading: isDishesLoading } = useCollection<Dish>(dishesQuery);

  const handleOpenEdit = (dish: Dish) => {
    setDishToEdit(dish);
    setIsFormOpen(true);
  }

  const handleOpenAdd = () => {
    setDishToEdit(null);
    setIsFormOpen(true);
  }
  
  const handleFormSave = () => {
    setIsFormOpen(false);
    setDishToEdit(null);
  }

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setDishToEdit(null);
  };

  const handleDelete = async () => {
    if (!dishToDelete || !firestore) return;
    const dishRef = doc(firestore, 'dishes', dishToDelete.id);
    await deleteDocumentNonBlocking(dishRef);
    toast({ title: t('dish_deleted'), description: `"${dishToDelete.name[locale]}" ${t('has_been_deleted')}.` });
    setDishToDelete(null);
  };

  const handleSeedMenu = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    const dishesColRef = collection(firestore, 'dishes');
    
    try {
        for (const dish of SAMPLE_DISHES) {
            await addDocumentNonBlocking(dishesColRef, dish);
        }
        toast({
            title: "Menu Seeded",
            description: `Successfully added ${SAMPLE_DISHES.length} unique dishes (10 per category) to the menu.`,
        });
    } catch (error) {
        console.error("Error seeding menu:", error);
        toast({
            variant: "destructive",
            title: "Seeding Failed",
            description: "An error occurred while seeding the menu.",
        });
    } finally {
        setIsSeeding(false);
    }
  };
  
  const isLoading = isAdminLoading || isDishesLoading;
  const canManage = isSuperAdmin || isAdmin;

  if (isLoading) {
    return <PageLoadingSkeleton title={t('menu_management')} description={t('menu_management_desc')} />;
  }

  if (!canManage) {
    return <NoAccessCard />;
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{t('menu_management')}</CardTitle>
              <CardDescription>{t('menu_management_desc')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSeedMenu} disabled={isSeeding}>
                  {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
                  Seed 100 Unique Dishes
              </Button>
              <Button onClick={handleOpenAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('add_new_dish')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dish_name')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead className="text-right">{t('price')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dishes && dishes.length > 0 ? dishes.map((dish) => (
                  <TableRow key={dish.id}>
                    <TableCell className="font-medium">{dish.name[locale] || dish.name['en']}</TableCell>
                    <TableCell>{t(dish.category)}</TableCell>
                    <TableCell className="text-right">{dish.price.toFixed(2)} {t('currency')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenEdit(dish)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => setDishToDelete(dish)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No dishes in the menu. Use "Seed 100 Unique Dishes" to get started!
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{dishToEdit ? t('edit_dish') : t('add_new_dish')}</DialogTitle>
            <DialogDescription>{dishToEdit ? t('edit_dish_desc') : t('add_new_dish_desc')}</DialogDescription>
          </DialogHeader>
          <DishForm dish={dishToEdit} onSave={handleFormSave} onCancel={handleFormCancel} />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!dishToDelete} onOpenChange={(open) => !open && setDishToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>{t('delete_dish_confirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDishToDelete(null)}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
