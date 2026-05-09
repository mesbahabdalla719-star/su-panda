'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * In development, it throws the error to trigger the dev overlay.
 * In production, it logs the error and shows a toast to prevent a full app crash.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log for production debugging
      console.error("Firestore Permission Denied:", error.request);
      
      // Notify the user gracefully
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to perform this action or view this data.",
      });

      // Set error in state
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // Only throw in development. In production, we rely on UI error states and toasts.
  if (error && process.env.NODE_ENV === 'development') {
    throw error;
  }

  return null;
}
