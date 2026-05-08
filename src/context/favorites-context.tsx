
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Dish } from '@/lib/types';
import { useUser, useFirebase, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface FavoritesContextType {
  favorites: Dish[];
  toggleFavorite: (dish: Dish) => void;
  isFavorite: (dishId: string) => boolean;
  favoritesCount: number;
  clearFavorites: () => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const { user, isUserLoading, auth } = useFirebase();
  const { firestore } = useFirebase();

  const favoritesRef = useMemoFirebase(() => {
    if (firestore && user) {
      return doc(firestore, 'customers', user.uid, 'favorites', 'current');
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
      if (user && favoritesRef) {
        try {
          const docSnap = await getDoc(favoritesRef);
          if (docSnap.exists() && docSnap.data().items) {
             setFavorites(docSnap.data().items);
          } else {
            const storedFavorites = localStorage.getItem('favorites');
            if (storedFavorites) {
              const localFavorites = JSON.parse(storedFavorites);
              setFavorites(localFavorites);
              localStorage.removeItem('favorites');
            } else {
              setFavorites([]);
            }
          }
        } catch (error) {
          console.error("Failed to load favorites from Firestore:", error);
          setFavorites([]);
        }
      } else if (!user) {
        try {
          const storedFavorites = localStorage.getItem('favorites');
          setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);
        } catch (error) {
           console.error("Failed to parse favorites from localStorage", error);
           setFavorites([]);
        }
      }
      setIsLoading(false);
    };
    
    loadData();
  }, [isMounted, user, isUserLoading, favoritesRef]);

  // Effect to save data to Firestore or localStorage
  useEffect(() => {
    if (isLoading || !isMounted) return;

    // Check for active auth session to avoid permission errors
    if (user && favoritesRef && auth?.currentUser) {
      setDocumentNonBlocking(favoritesRef, { items: favorites }, { merge: true });
    } else if (!user) {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites, user, favoritesRef, isLoading, isMounted, auth]);

  const toggleFavorite = (dish: Dish) => {
    setFavorites(prevFavorites => {
      const isAlreadyFavorite = prevFavorites.some(fav => fav.id === dish.id);
      if (isAlreadyFavorite) {
        return prevFavorites.filter(fav => fav.id !== dish.id);
      } else {
        return [...prevFavorites, dish];
      }
    });
  };

  const isFavorite = (dishId: string) => {
    return favorites.some(fav => fav.id === dishId);
  };
  
  const clearFavorites = useCallback(() => {
    setFavorites([]);
     if (!user) {
      localStorage.removeItem('favorites');
    }
    if (user && favoritesRef && auth?.currentUser) {
      setDocumentNonBlocking(favoritesRef, { items: [] }, { merge: true });
    }
  }, [user, favoritesRef, auth]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, favoritesCount: favorites.length, clearFavorites, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
