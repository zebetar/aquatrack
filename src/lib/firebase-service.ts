

import { MOCK_CUSTOMERS, MOCK_USAGE_RECORDS, MOCK_PAYMENTS, MOCK_NOTIFICATIONS, MOCK_USERS } from './mock-data-store';
import type { Customer, WaterUsageRecord, Payment, Notification } from '@/types';
import { format } from 'date-fns';

// --- Helper Functions ---
const findCustomerById = (id: string) => MOCK_CUSTOMERS.find(c => c.id === id);

// --- Customer Functions ---

export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'balance'>): Promise<Customer> {
    const newCustomer: Customer = {
        id: `cust_${new Date().getTime()}`,
        ...customerData,
        balance: 0,
        createdAt: new Date(),
    };
    if (newCustomer.email && !newCustomer.authUID) {
        // Find if a mock user exists for this email, if so, link them.
        const existingUser = MOCK_USERS.find(u => u.email === newCustomer.email);
        if(existingUser) {
            newCustomer.authUID = existingUser.id;
        } else {
            // If no user exists, create a placeholder authUID. In a real app, this would be more robust.
            newCustomer.authUID = `authuid-${Math.random().toString(36).substring(2, 9)}`;
        }
    }
    MOCK_CUSTOMERS.unshift(newCustomer);
    return newCustomer;
}


export async function getAllCustomers(): Promise<Customer[]> {
  return [...MOCK_CUSTOMERS].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  return findCustomerById(customerId) || null;
}

export async function getCustomerByAuthUID(authUID: string): Promise<Customer | null> {
  const customer = MOCK_CUSTOMERS.find(c => c.authUID === authUID);
  return customer || null;
}


export async function updateCustomer(customerId: string, customerUpdate: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<void> {
    const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === customerId);
    if(customerIndex !== -1) {
        MOCK_CUSTOMERS[customerIndex] = { ...MOCK_CUSTOMERS[customerIndex], ...customerUpdate };
    }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const index = MOCK_CUSTOMERS.findIndex(c => c.id === customerId);
  if (index !== -1) {
    MOCK_CUSTOMERS.splice(index, 1);
    
    // Also remove their usage and payments for a clean delete
    let i = MOCK_USAGE_RECORDS.length;
    while(i--) {
        if(MOCK_USAGE_RECORDS[i].customerId === customerId) {
            MOCK_USAGE_RECORDS.splice(i,1);
        }
    }
    
    let j = MOCK_PAYMENTS.length;
    while(j--) {
        if(MOCK_PAYMENTS[j].customerId === customerId) {
            MOCK_PAYMENTS.splice(j,1);
        }
    }
  }
}

export async function getOutstandingCustomers(): Promise<Customer[]> {
  return MOCK_CUSTOMERS.filter(c => c.balance > 0).sort((a,b) => b.balance - a.balance);
}


// --- Usage Record Functions ---

export async function addUsageRecord(recordData: Omit<WaterUsageRecord, 'id' | 'createdAt'>): Promise<WaterUsageRecord> {
  const newRecord: WaterUsageRecord = {
    id: `usage_${new Date().getTime()}`,
    ...recordData,
    createdAt: new Date(),
  };
  MOCK_USAGE_RECORDS.unshift(newRecord);
  
  // Update customer balance
  const customer = findCustomerById(newRecord.customerId);
  if (customer) {
    customer.balance += newRecord.cost;
  }
  
  return newRecord;
}

export async function updateUsageRecord(recordId: string, updatedData: Partial<Omit<WaterUsageRecord, 'id'>>): Promise<void> {
    const recordIndex = MOCK_USAGE_RECORDS.findIndex(r => r.id === recordId);
    if (recordIndex !== -1) {
        const oldRecord = MOCK_USAGE_RECORDS[recordIndex];
        const costDifference = (updatedData.cost ?? oldRecord.cost) - oldRecord.cost;

        MOCK_USAGE_RECORDS[recordIndex] = { ...oldRecord, ...updatedData };
        
        if (costDifference !== 0) {
            const customer = findCustomerById(oldRecord.customerId);
            if (customer) {
                customer.balance += costDifference;
            }
        }
    }
}

export async function getAllUsageRecords(): Promise<WaterUsageRecord[]> {
  return [...MOCK_USAGE_RECORDS].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getUsageRecordsByCustomerId(customerId: string): Promise<WaterUsageRecord[]> {
  return MOCK_USAGE_RECORDS.filter(r => r.customerId === customerId).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
}


// --- Payment Functions ---

export async function addPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  const newPayment: Payment = {
    id: `pay_${new Date().getTime()}`,
    ...paymentData,
    createdAt: new Date(),
  };
  MOCK_PAYMENTS.unshift(newPayment);
  
  // Update customer balance
  const customer = findCustomerById(newPayment.customerId);
  if (customer) {
    customer.balance -= newPayment.amountPaid;
  }
  
  return newPayment;
}

export async function updatePaymentRecord(paymentId: string, updatedData: Partial<Omit<Payment, 'id'>>): Promise<void> {
    const paymentIndex = MOCK_PAYMENTS.findIndex(p => p.id === paymentId);
    if(paymentIndex !== -1) {
        const oldPayment = MOCK_PAYMENTS[paymentIndex];
        const amountDifference = oldPayment.amountPaid - (updatedData.amountPaid ?? oldPayment.amountPaid);
        
        MOCK_PAYMENTS[paymentIndex] = { ...oldPayment, ...updatedData };

        if (amountDifference !== 0) {
            const customer = findCustomerById(oldPayment.customerId);
            if (customer) {
                customer.balance += amountDifference;
            }
        }
    }
}

export async function getAllPayments(): Promise<Payment[]> {
  return [...MOCK_PAYMENTS].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPaymentsByCustomerId(customerId: string): Promise<Payment[]> {
  return MOCK_PAYMENTS.filter(p => p.customerId === customerId).sort((a,b) => b.paymentDate.getTime() - a.paymentDate.getTime());
}


// --- Notification Functions ---

export async function addNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  const newNotification: Notification = {
    id: `notif_${new Date().getTime()}`,
    ...notificationData,
    createdAt: new Date(),
  };
  MOCK_NOTIFICATIONS.unshift(newNotification);
}

export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return MOCK_NOTIFICATIONS.filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = MOCK_NOTIFICATIONS.find(n => n.id === notificationId);
    if (notification) {
        notification.isRead = true;
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    MOCK_NOTIFICATIONS.forEach(notification => {
        if (notification.userId === userId && !notification.isRead) {
            notification.isRead = true;
        }
    });
}
