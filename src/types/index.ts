import { z } from 'zod';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  name?: string;
  customerId?: string; // For viewers, linking to their customer profile
  fcmToken?: string;
  avatarUrl?: string; // Added for custom avatar
}

export interface Customer {
  id: string;
  name: string;
  email?: string; // Email used for the linked viewer account
  contactInfo?: string; // e.g., phone number or address
  authUID?: string; // Firebase Auth UID of the linked viewer account
  createdAt: Date;
  balance: number; // Current outstanding balance
}

export interface WaterUsageRecord {
  id: string;
  customerId: string;
  customerName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  cost: number; // durationHours * CORE_WATER_RATE_PER_HOUR
  recordedBy: string; // Admin's UID
  createdAt: Date;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  paymentDate: Date;
  amountPaid: number;
  recordedBy: string; // Admin's UID
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string; // Target user's ID (viewer authUID, customerId, or admin ID 'admin001')
  message: string;
  type: 'USAGE_LOGGED' | 'PAYMENT_RECORDED' | 'ANNOUNCEMENT' | 'BILL_REMINDER' | 'CUSTOMER_ADDED' | 'CUSTOMER_UPDATED';
  isRead: boolean;
  linkTo?: string; // Optional link to navigate within the app
  createdAt: Date;
}

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  role?: 'admin' | 'viewer'; // To control visibility
}

export interface CustomerMonthlyUsage {
  id: string; // customerId
  name: string;
  usageHours: number;
  cost: number;
}

export const DashboardMetricsSchema = z.object({
  totalCustomers: z.number().describe('The total number of customers.'),
  monthlySupply: z.number().describe('The total water supply in hours for the current month.'),
  monthlyRevenue: z.number().describe('The total revenue in PKR for the current month.'),
  outstandingBillsValue: z.number().describe('The total value of all outstanding bills in PKR.'),
  supplyChange: z.number().describe('The percentage change in supply compared to the previous month.'),
  revenueChange: z.number().describe('The percentage change in revenue compared to the previous month.'),
});

export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
