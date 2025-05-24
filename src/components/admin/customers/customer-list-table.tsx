"use client";

import type { Customer } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Eye, Edit, Trash2 } from 'lucide-react'; // Edit and Trash2 for future actions
import { format } from 'date-fns';

interface CustomerListTableProps {
  customers: Customer[];
}

export function CustomerListTable({ customers }: CustomerListTableProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Joined On</TableHead>
            <TableHead className="text-right">Balance (PKR)</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No customers found.
              </TableCell>
            </TableRow>
          )}
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.contactInfo || '-'}</TableCell>
              <TableCell>{format(new Date(customer.createdAt), 'PP')}</TableCell>
              <TableCell className="text-right">{customer.balance.toLocaleString('en-US')}</TableCell>
              <TableCell className="text-center">
                <Badge variant={customer.balance > 0 ? "destructive" : customer.balance < 0 ? "secondary" : "default"}>
                  {customer.balance > 0 ? "Due" : customer.balance < 0 ? "Credit" : "Settled"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" asChild title="View Details">
                  <Link href={`/admin/customers/${customer.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                 {/* Placeholder for future actions */}
                {/* <Button variant="ghost" size="icon" title="Edit Customer">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Delete Customer" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button> */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
