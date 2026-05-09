'use client';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import type { Customer } from '@/lib/types';
import { useMemo } from 'react';

// MASTER ADMIN UID for mesbahabdalla719@gmail.com
const SUPER_ADMIN_UID = 'nWh4SGrdQYZs8wlTg1PqpXoQnB73';

/**
 * A hook to determine the current user's administrative roles.
 * Provides absolute clarity on whether the user is a Super Admin, Admin, or Staff.
 */
export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'customers', user.uid);
  }, [firestore, user?.uid]);

  const { data: customerData, isLoading: isCustomerLoading } = useDoc<Customer>(customerDocRef);

  const isLoading = isUserLoading || (!!user && isCustomerLoading);

  const roles = useMemo(() => {
    if (isLoading || !user) {
      return { isSuperAdmin: false, isAdmin: false, isStaff: false };
    }
    
    // Hardcoded check for the absolute master admin UID found in your logs
    const isSuperAdmin = user.uid === SUPER_ADMIN_UID;

    // Role-based check from Firestore document
    const role = customerData?.role;
    const isAdmin = isSuperAdmin || role === 'admin';
    const isStaff = isAdmin || role === 'staff';
    
    return { isSuperAdmin, isAdmin, isStaff };
  }, [user, customerData, isLoading]);

  return {
    user,
    isLoading,
    ...roles
  };
}
