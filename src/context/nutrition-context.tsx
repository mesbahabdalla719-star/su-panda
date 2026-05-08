'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { format } from 'date-fns';
import { useUser, useFirebase, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';


interface NutritionInfo {
  protein: number;
  sugar: number;
  calories: number;
}

interface NutritionDayInfo extends NutritionInfo {}

type NutritionHistory = Record<string, NutritionDayInfo>;

interface NutritionContextType {
  history: NutritionHistory;
  addNutritionEntry: (entry: NutritionInfo, date?: Date) => void;
  clearNutritionForDate: (date: Date) => void;
  getTotalsForDate: (date: Date) => NutritionDayInfo;
  clearAllNutrition: () => void;
  isLoading: boolean;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<NutritionHistory>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const nutritionRef = useMemoFirebase(() => {
    if (firestore && user) {
      return doc(firestore, 'customers', user.uid, 'nutrition', 'history');
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
      if (user && nutritionRef) {
        try {
          const docSnap = await getDoc(nutritionRef);
          if (docSnap.exists() && docSnap.data().history) {
            setHistory(docSnap.data().history);
          } else {
             const storedData = localStorage.getItem('nutritionHistory');
             if (storedData) {
                const localHistory = JSON.parse(storedData);
                setHistory(localHistory);
                localStorage.removeItem('nutritionHistory');
             } else {
                setHistory({});
             }
          }
        } catch (error) {
          console.error("Failed to load nutrition history from Firestore:", error);
          setHistory({});
        }
      } else if (!user) {
        try {
          const storedData = localStorage.getItem('nutritionHistory');
          setHistory(storedData ? JSON.parse(storedData) : {});
        } catch (error) {
          console.error("Failed to parse nutrition data from localStorage", error);
          setHistory({});
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, [isMounted, user, isUserLoading, nutritionRef]);


  // Effect to save data to Firestore or localStorage
  useEffect(() => {
    if (isLoading || !isMounted) return;

    if (user && nutritionRef) {
      setDocumentNonBlocking(nutritionRef, { history }, { merge: true });
    } else if (!user) {
      localStorage.setItem('nutritionHistory', JSON.stringify(history));
    }
  }, [history, user, nutritionRef, isLoading, isMounted]);

  const addNutritionEntry = (entry: NutritionInfo, date: Date = new Date()) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setHistory(prevHistory => {
      const dayTotals = prevHistory[dateKey] || { protein: 0, sugar: 0, calories: 0 };
      return {
        ...prevHistory,
        [dateKey]: {
          protein: dayTotals.protein + (entry.protein || 0),
          sugar: dayTotals.sugar + (entry.sugar || 0),
          calories: dayTotals.calories + (entry.calories || 0),
        }
      };
    });
  };

  const clearNutritionForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[dateKey];
      return newHistory;
    });
  };

  const getTotalsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return history[dateKey] || { protein: 0, sugar: 0, calories: 0 };
  };

  const clearAllNutrition = useCallback(() => {
    setHistory({});
    if (!user) {
      localStorage.removeItem('nutritionHistory');
    }
     if (user && nutritionRef) {
      setDocumentNonBlocking(nutritionRef, { history: {} }, { merge: true });
    }
  }, [user, nutritionRef]);

  return (
    <NutritionContext.Provider value={{ history, addNutritionEntry, clearNutritionForDate, getTotalsForDate, clearAllNutrition, isLoading }}>
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
};
