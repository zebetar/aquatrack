
// This file contains mock data for the application.
// In a real application, this data would come from a database.
import type { User, Customer, WaterUsageRecord, Payment, Notification } from '@/types';
import { subDays, subHours } from 'date-fns';

// --- MOCK USERS ---
export const MOCK_USERS: (User & { password?: string })[] = [
  {
    id: 'admin001',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
    name: 'Admin User',
  },
  {
    id: 'viewer001',
    email: 'viewer@example.com',
    password: 'password',
    role: 'viewer',
    name: 'John Doe',
    customerId: 'cust_001',
  },
  {
    id: 'viewer002',
    email: 'viewer2@example.com',
    password: 'password',
    role: 'viewer',
    name: 'Jane Smith',
    customerId: 'cust_002'
  }
];


// --- MOCK CUSTOMERS ---
export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust_001',
    name: 'John Doe',
    email: 'viewer@example.com',
    contactInfo: '123-456-7890',
    authUID: 'viewer001',
    createdAt: subDays(new Date(), 30),
    balance: 1500,
  },
  {
    id: 'cust_002',
    name: 'Jane Smith',
    email: 'viewer2@example.com',
    contactInfo: '098-765-4321',
    authUID: 'viewer002',
    createdAt: subDays(new Date(), 60),
    balance: 0,
  },
   {
    id: 'cust_003',
    name: 'Peter Jones',
    email: 'peter@example.com',
    contactInfo: '555-555-5555',
    createdAt: subDays(new Date(), 5),
    balance: 800,
  },
];

// --- MOCK USAGE RECORDS ---
export const MOCK_USAGE_RECORDS: WaterUsageRecord[] = [
  {
    id: 'usage_001',
    customerId: 'cust_001',
    customerName: 'John Doe',
    date: subDays(new Date(), 2),
    startTime: subHours(subDays(new Date(), 2), 4),
    endTime: subHours(subDays(new Date(), 2), 2),
    durationHours: 2,
    cost: 2400,
    recordedBy: 'admin001',
    createdAt: subDays(new Date(), 2),
  },
  {
    id: 'usage_002',
    customerId: 'cust_002',
    customerName: 'Jane Smith',
    date: subDays(new Date(), 3),
    startTime: subHours(subDays(new Date(), 3), 6),
    endTime: subHours(subDays(new Date(), 3), 5),
    durationHours: 1,
    cost: 1200,
    recordedBy: 'admin001',
    createdAt: subDays(new Date(), 3),
  },
  {
    id: 'usage_003',
    customerId: 'cust_001',
    customerName: 'John Doe',
    date: subDays(new Date(), 10),
    startTime: subHours(subDays(new Date(), 10), 3),
    endTime: subHours(subDays(new Date(), 10), 1),
    durationHours: 2.5,
    cost: 3000,
    recordedBy: 'admin001',
    createdAt: subDays(new Date(), 10),
  },
   {
    id: 'usage_004',
    customerId: 'cust_003',
    customerName: 'Peter Jones',
    date: subDays(new Date(), 1),
    startTime: subHours(subDays(new Date(), 1), 2),
    endTime: subHours(subDays(new Date(), 1), 1),
    durationHours: 1,
    cost: 1200,
    recordedBy: 'admin001',
    createdAt: subDays(new Date(), 1),
  },
];

// --- MOCK PAYMENTS ---
export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay_001',
    customerId: 'cust_002',
    customerName: 'Jane Smith',
    paymentDate: subDays(new Date(), 5),
    amountPaid: 5000,
    recordedBy: 'admin001',
    createdAt: subDays(new Date(), 5),
  },
   {
    id: 'pay_002',
    customerId: 'cust_001',
    customerName: 'John Doe',
    paymentDate: subDays(new Date(), 15),
    amountPaid: 2000,
    recordedBy: 'admin001',
    createdAt: subDays(new Date(), 15),
  },
];

// --- MOCK NOTIFICATIONS ---
export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif_001',
        userId: 'admin001',
        message: 'New customer "Peter Jones" was added.',
        type: 'CUSTOMER_ADDED',
        isRead: false,
        createdAt: subDays(new Date(), 1),
        linkTo: '/admin/customers/cust_003'
    },
    {
        id: 'notif_002',
        userId: 'viewer001',
        message: 'A new water usage of 2 hours was logged.',
        type: 'USAGE_LOGGED',
        isRead: false,
        createdAt: subDays(new Date(), 2),
        linkTo: '/viewer/usage'
    },
     {
        id: 'notif_003',
        userId: 'viewer002',
        message: 'A payment of PKR 5,000 has been recorded.',
        type: 'PAYMENT_RECORDED',
        isRead: true,
        createdAt: subDays(new Date(), 5),
        linkTo: '/viewer/billing'
    }
];
