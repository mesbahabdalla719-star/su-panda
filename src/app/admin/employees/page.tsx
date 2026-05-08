'use client';

import { useLanguage } from '@/context/language-context';
import { useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import type { Customer, UserRole } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

function EmployeesLoadingSkeleton() {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
}

function NoAccessCard() {
    const { t } = useLanguage();
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    {t('access_denied')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>You must be a Super Administrator to manage employees.</p>
            </CardContent>
        </Card>
    );
}


function SuperAdminEmployeesTable() {
    const { t } = useLanguage();
    const { firestore } = useFirebase();
    const { user: adminUser } = useAdmin();
    const { toast } = useToast();
    const [jobTitles, setJobTitles] = useState<Record<string, string>>({});
  
    const customersQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'customers');
    }, [firestore]);
  
    const { data: customers, isLoading, error } = useCollection<Customer>(customersQuery);
    
    useEffect(() => {
      if (customers) {
          const initialJobTitles = customers.reduce((acc, customer) => {
              if (customer.jobTitle) {
                  acc[customer.id] = customer.jobTitle;
              } else {
                  acc[customer.id] = '';
              }
              return acc;
          }, {} as Record<string, string>);
          setJobTitles(initialJobTitles);
      }
    }, [customers]);
  
    const handleRoleChange = (customerId: string, newRole: UserRole) => {
      if (!firestore || !adminUser) return;
      
      if (customerId === adminUser.uid && newRole !== 'admin') {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: "You cannot demote your own account.",
        });
        return;
      }
  
      const customerRef = doc(firestore, 'customers', customerId);
      updateDocumentNonBlocking(customerRef, { role: newRole });
  
      toast({
        title: 'Role Updated',
        description: `User role has been changed to ${newRole}.`
      });
    }
  
    const handleJobTitleChange = (customerId: string, value: string) => {
      setJobTitles(prev => ({ ...prev, [customerId]: value }));
    };
  
    const handleJobTitleBlur = (customerId: string) => {
      if (!firestore) return;
      const newJobTitle = jobTitles[customerId];
      const originalJobTitle = customers?.find(c => c.id === customerId)?.jobTitle || '';
  
      if (newJobTitle !== undefined && newJobTitle !== originalJobTitle) {
          const customerRef = doc(firestore, 'customers', customerId);
          updateDocumentNonBlocking(customerRef, { jobTitle: newJobTitle });
          toast({
              title: 'Job Title Updated',
              description: `Job title for user has been updated.`
          });
      }
    };
  
    const handleDeleteCustomer = (customerId: string) => {
      if (!firestore || !adminUser) return;
  
      if (customerId === adminUser.uid) {
          toast({
              variant: 'destructive',
              title: 'Error',
              description: "You cannot delete your own account.",
          });
          return;
      }
  
      const customerRef = doc(firestore, 'customers', customerId);
      deleteDocumentNonBlocking(customerRef);
  
      toast({
          title: 'User Deleted',
          description: `The user has been removed from the customer list.`,
      });
    };
  
    if (isLoading) {
      return <EmployeesLoadingSkeleton />;
    }
    
    if (error) {
      console.error("Error fetching customers:", error);
      return <p className="text-destructive">Error loading employees: {error.message}</p>
    }
  
    return (
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('job_title')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers && customers.map((customer) => (
                <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.firstName} {customer.lastName}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                    <Input
                        type="text"
                        value={jobTitles[customer.id] || ''}
                        onChange={(e) => handleJobTitleChange(customer.id, e.target.value)}
                        onBlur={() => handleJobTitleBlur(customer.id)}
                        className="max-w-[150px]"
                    />
                    </TableCell>
                    <TableCell>
                    <Select
                        defaultValue={customer.role}
                        onValueChange={(value) => handleRoleChange(customer.id, value as UserRole)}
                    >
                        <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="customer">{t('customer')}</SelectItem>
                        <SelectItem value="staff">{t('staff')}</SelectItem>
                        <SelectItem value="admin">{t('admin')}</SelectItem>
                        </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell className="text-right">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={customer.id === adminUser?.uid}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('delete_user_confirm')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>
                                        {t('delete')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function EmployeesPage() {
  const { t } = useLanguage();
  const { isSuperAdmin, isLoading: isAdminLoading } = useAdmin();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('employees')}</CardTitle>
        <CardDescription>{t('employees_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isAdminLoading ? (
            <EmployeesLoadingSkeleton />
        ) : isSuperAdmin ? (
            <SuperAdminEmployeesTable />
        ) : (
            <NoAccessCard />
        )}
      </CardContent>
    </Card>
  );
}
