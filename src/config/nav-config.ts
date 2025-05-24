import type { NavItem } from '@/types';
import {
  LayoutDashboard,
  Users,
  Droplets,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  FileText,
  ListChecks
} from 'lucide-react';

export const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    role: 'admin',
  },
  {
    title: 'Customers',
    href: '/admin/customers',
    icon: Users,
    role: 'admin',
  },
  {
    title: 'Water Usage',
    href: '/admin/usage', // Or integrate into customers
    icon: Droplets,
    role: 'admin',
    disabled: true, // Example: can be enabled later
  },
  {
    title: 'Payments',
    href: '/admin/payments', // Or integrate into customers
    icon: CreditCard,
    role: 'admin',
    disabled: true, // Example: can be enabled later
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    role: 'admin',
  },
   {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    role: 'admin',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    role: 'admin',
  },
];

export const viewerNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/viewer/dashboard',
    icon: LayoutDashboard,
    role: 'viewer',
  },
  {
    title: 'My Usage',
    href: '/viewer/usage',
    icon: Droplets, // Using Droplets, could be ListChecks or FileText
    role: 'viewer',
  },
  {
    title: 'My Billing',
    href: '/viewer/billing',
    icon: CreditCard, // Using CreditCard, could be FileText
    role: 'viewer',
  },
  {
    title: 'Notifications',
    href: '/viewer/notifications',
    icon: Bell,
    role: 'viewer',
  },
   {
    title: 'Profile',
    href: '/viewer/profile',
    icon: Users, // Using Users as a generic profile icon
    role: 'viewer',
  },
];
