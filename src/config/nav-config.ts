
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
  UserCog, // Added for User Management
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
    href: '/admin/usage',
    icon: Droplets,
    role: 'admin',
  },
  {
    title: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
    role: 'admin',
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
    title: 'User Management', 
    href: '/admin/users',
    icon: UserCog, // Using UserCog
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
    icon: Droplets,
    role: 'viewer',
  },
  {
    title: 'My Billing',
    href: '/viewer/billing',
    icon: CreditCard,
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
    icon: Users, // Using Users icon for profile for viewers
    role: 'viewer',
  },
];
