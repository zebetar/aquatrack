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
  id:string;
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

export interface CommandItem {
  id: string;
  type: 'page' | 'customer' | 'action';
  title: string;
  description?: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
}

// Schemas and Types for Revenue Projection
export const ProjectRevenueInputSchema = z.object({
  lastMonthRevenue: z.number().describe("The total revenue from the previous month."),
  currentMonthRevenue: z.number().describe("The total revenue so far in the current month."),
  currentDate: z.string().describe("The current date in ISO 8601 format."),
});
export type ProjectRevenueInput = z.infer<typeof ProjectRevenueInputSchema>;

export const ProjectedRevenueOutputSchema = z.object({
  projectedAmount: z.number().describe("The forecasted revenue amount for the next month."),
  reasoning: z.string().describe("A brief (1-2 sentences) explanation of the key factors that influenced the projection, such as seasonality or weather."),
});
export type ProjectedRevenueOutput = z.infer<typeof ProjectedRevenueOutputSchema>;
