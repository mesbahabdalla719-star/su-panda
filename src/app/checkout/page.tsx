'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { cartItems, totalPrice, clearCart } = useCart();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const formSchema = z.object({
    fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
    address: z.string().min(10, { message: "Address must be at least 10 characters." }),
    phone: z.string().min(8, { message: "Please enter a valid phone number." }),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      address: "",
      phone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to place an order.",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Cart",
        description: "You cannot place an order with an empty cart.",
      });
      return;
    }

    const orderData = {
      userId: user.uid,
      customerDetails: values,
      items: cartItems.map(item => ({
        id: item.dish.id,
        name: item.dish.name,
        quantity: item.quantity,
        price: item.dish.price,
      })),
      totalPrice: totalPrice,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    
    const ordersCollectionRef = collection(firestore, "customers", user.uid, "orders");
    
    try {
        const docRef = await addDoc(ordersCollectionRef, orderData);
        const orderId = docRef.id;

        clearCart();
        toast({
            title: t('order_placed'),
            description: t('order_placed_desc'),
        });

        router.push(`/order-success?orderId=${orderId}`);

    } catch (error) {
        console.error("Error placing order: ", error);
        
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: ordersCollectionRef.path,
            operation: 'create',
            requestResourceData: orderData,
          })
        );

        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to place order. Please try again.",
        });
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold font-headline">{t('checkout_title')}</h1>
        <p className="text-muted-foreground">{t('checkout_subtitle')}</p>
      </div>
      <div className="bg-card p-8 rounded-lg shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('full_name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('address')}</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Riyadh" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phone_number')}</FormLabel>
                  <FormControl>
                    <Input placeholder="+966 50 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" size="lg" disabled={cartItems.length === 0}>{t('place_order')}</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
