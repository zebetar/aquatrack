
"use client";

import type { Payment, Customer } from '@/types'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getMockPaymentsByCustomerId, getMockCustomerById } from '@/lib/mock-data-store';
import { Loader2 } from 'lucide-react';

export default function ViewerBillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBillingData = useCallback(async () => {
    if (!user || !user.customerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const paymentData = getMockPaymentsByCustomerId(user.customerId);
    const profileData = getMockCustomerById(user.customerId);
    
    setPayments(paymentData.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())); // Sort here
    setCustomerProfile(profileData || null);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadBillingData();
    }
  }, [authLoading, loadBillingData]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading billing information...</p>
      </div>
    );
  }
  
  if (!user) {
      return <p>Not authenticated. Please log in.</p>
  }

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  return (
    <div className="mt-6 space-y-6">
      {customerProfile ? (
        <Card className="shadow-md glassmorphism-card">
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
                <p className="text-sm text-muted-foreground">Current Outstanding Balance</p>
                <p className="text-2xl font-bold">PKR {customerProfile.balance.toLocaleString('en-US')}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Total Amount Paid (All Time)</p>
                <p className="text-2xl font-bold">PKR {totalPaid.toLocaleString('en-US')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
         <Card className="shadow-md glassmorphism-card">
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">Billing information is currently unavailable.</p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md glassmorphism-card">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-24rem)] w-full">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Amount Paid (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center h-24">No payment records found.</TableCell></TableRow>
                ) : (
                  payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.paymentDate), 'PP p')}</TableCell>
                      <TableCell className="text-right">{payment.amountPaid.toLocaleString('en-US')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

    