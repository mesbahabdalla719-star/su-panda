
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { CartItem, Dish } from '@/lib/types';
import { useUser, useFirebase, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (dish: Dish, quantity?: number) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const { user, isUserLoading, auth } = useFirebase();
  const { firestore } = useFirebase();

  const cartRef = useMemoFirebase(() => {
    if (firestore && user) {
      return doc(firestore, 'customers', user.uid, 'cart', 'current');
    }
    return null;
  }, [firestore, user]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Effect to load data from Firestore or localStorage
  useEffect(() => {
    if (!isMounted || isUserLoading) return;

    const loadData = async () => {
      setIsLoading(true);
      if (user && cartRef) {
        // User is logged in, load from Firestore
        try {
          const docSnap = await getDoc(cartRef);
          if (docSnap.exists() && docSnap.data().items) {
            setCartItems(docSnap.data().items);
          } else {
            // If firestore is empty, check localStorage to migrate anonymous cart
            const storedCart = localStorage.getItem('cart');
            if (storedCart) {
              const localCartItems = JSON.parse(storedCart);
              setCartItems(localCartItems);
              localStorage.removeItem('cart'); // Clear local cart after migration
            } else {
              setCartItems([]);
            }
          }
        } catch (error) {
          console.error("Failed to load cart from Firestore:", error);
          setCartItems([]);
        }
      } else if (!user) {
        // User is not logged in, load from localStorage
        try {
          const storedCart = localStorage.getItem('cart');
          setCartItems(storedCart ? JSON.parse(storedCart) : []);
        } catch (error) {
          console.error("Failed to parse cart from localStorage", error);
          setCartItems([]);
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, [isMounted, user, isUserLoading, cartRef]);


  // Effect to save data to Firestore or localStorage
  useEffect(() => {
    // We don't save during initial loading or if the component is not mounted yet.
    if (isLoading || !isMounted) return;

    // Critical: Only attempt firestore write if we have both a user state AND an active auth session
    if (user && cartRef && auth?.currentUser) {
      // User is logged in, save to Firestore.
      setDocumentNonBlocking(cartRef, { items: cartItems }, { merge: true });
    } else if (!user) {
      // User is not logged in, save to localStorage.
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, user, cartRef, isLoading, isMounted, auth]);

  const addToCart = (dish: Dish, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.dish.id === dish.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { dish, quantity }];
    });
  };

  const removeFromCart = (dishId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.dish.id !== dishId));
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.dish.id === dishId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = useCallback(() => {
    setCartItems([]);
    if (!user) {
      localStorage.removeItem('cart');
    }
    // Ensure we don't try to clear firestore cart if user just logged out
    if (user && cartRef && auth?.currentUser) {
      setDocumentNonBlocking(cartRef, { items: [] }, { merge: true });
    }
  }, [user, cartRef, auth]);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.dish.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, totalPrice, isLoading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
