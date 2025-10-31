
import { MOCK_USERS, MOCK_CUSTOMERS, MOCK_USAGE_RECORDS, MOCK_PAYMENTS, MOCK_NOTIFICATIONS } from './mock-data-store';
import type { Customer, WaterUsageRecord, Payment, Notification, User } from '@/types';

// This file simulates a database service using local mock data.

// Helper to simulate async operations
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- User Functions ---

export async function getUserProfile(userId: string): Promise<User | null> {
  await delay(100);
  const user = MOCK_USERS.find(u => u.id === userId);
  return user || null;
}

// --- Customer Functions ---

export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'balance'>): Promise<Customer> {
    await delay(300);
    const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        ...customerData,
        balance: 0,
        createdAt: new Date(),
    };
    MOCK_CUSTOMERS.unshift(newCustomer);
    return newCustomer;
}


export async function getAllCustomers(): Promise<Customer[]> {
  await delay(500);
  return [...MOCK_CUSTOMERS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  await delay(100);
  const customer = MOCK_CUSTOMERS.find(c => c.id === customerId);
  return customer || null;
}

export async function getCustomerByAuthUID(authUID: string): Promise<Customer | null> {
    await delay(100);
    const customer = MOCK_CUSTOMERS.find(c => c.authUID === authUID);
    return customer || null;
}

export async function updateCustomer(customerId: string, customerUpdate: Partial<Omit<Customer, 'id'>>): Promise<void> {
    await delay(200);
    const index = MOCK_CUSTOMERS.findIndex(c => c.id === customerId);
    if (index !== -1) {
        MOCK_CUSTOMERS[index] = { ...MOCK_CUSTOMERS[index], ...customerUpdate };
    }
}

export async function deleteCustomer(customerId: string): Promise<void> {
    await delay(400);
    const index = MOCK_CUSTOMERS.findIndex(c => c.id === customerId);
    if (index > -1) {
        MOCK_CUSTOMERS.splice(index, 1);
    }
}

export async function getOutstandingCustomers(): Promise<Customer[]> {
    await delay(300);
    return MOCK_CUSTOMERS.filter(c => c.balance > 0).sort((a,b) => b.balance - a.balance);
}


// --- Usage Record Functions ---

export async function addUsageRecord(recordData: Omit<WaterUsageRecord, 'id' | 'createdAt'>): Promise<WaterUsageRecord> {
  await delay(300);
  const newRecord: WaterUsageRecord = {
    ...recordData,
    id: `usage_${Date.now()}`,
    createdAt: new Date(),
  };
  MOCK_USAGE_RECORDS.unshift(newRecord);
  
  // Update customer balance
  const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === recordData.customerId);
  if (customerIndex !== -1) {
    MOCK_CUSTOMERS[customerIndex].balance += recordData.cost;
  }
  
  return newRecord;
}

export async function updateUsageRecord(recordId: string, updatedData: Partial<Omit<WaterUsageRecord, 'id'>>): Promise<void> {
    await delay(200);
    const index = MOCK_USAGE_RECORDS.findIndex(r => r.id === recordId);
    if (index !== -1) {
        const oldRecord = MOCK_USAGE_RECORDS[index];
        const costDifference = (updatedData.cost ?? oldRecord.cost) - oldRecord.cost;

        MOCK_USAGE_RECORDS[index] = { ...oldRecord, ...updatedData };

        if (costDifference !== 0) {
            const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === oldRecord.customerId);
            if (customerIndex !== -1) {
                MOCK_CUSTOMERS[customerIndex].balance += costDifference;
            }
        }
    }
}


export async function getAllUsageRecords(): Promise<WaterUsageRecord[]> {
  await delay(500);
  return [...MOCK_USAGE_RECORDS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getUsageRecordsByCustomerId(customerId: string): Promise<WaterUsageRecord[]> {
  await delay(300);
  return MOCK_USAGE_RECORDS.filter(r => r.customerId === customerId).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}


// --- Payment Functions ---

export async function addPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  await delay(300);
  const newPayment: Payment = {
      ...paymentData,
      id: `payment_${Date.now()}`,
      createdAt: new Date(),
  };
  MOCK_PAYMENTS.unshift(newPayment);

  // Update customer balance
  const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === paymentData.customerId);
  if (customerIndex !== -1) {
      MOCK_CUSTOMERS[customerIndex].balance -= paymentData.amountPaid;
  }
  
  return newPayment;
}

export async function updatePaymentRecord(paymentId: string, updatedData: Partial<Omit<Payment, 'id'>>): Promise<void> {
    await delay(200);
    const index = MOCK_PAYMENTS.findIndex(p => p.id === paymentId);
    if (index !== -1) {
        const oldPayment = MOCK_PAYMENTS[index];
        const amountDifference = oldPayment.amountPaid - (updatedData.amountPaid ?? oldPayment.amountPaid);
        
        MOCK_PAYMENTS[index] = { ...oldPayment, ...updatedData };
        
        if(amountDifference !== 0) {
            const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === oldPayment.customerId);
            if(customerIndex !== -1) {
                MOCK_CUSTOMERS[customerIndex].balance += amountDifference;
            }
        }
    }
}

export async function getAllPayments(): Promise<Payment[]> {
  await delay(500);
  return [...MOCK_PAYMENTS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPaymentsByCustomerId(customerId: string): Promise<Payment[]> {
  await delay(300);
  return MOCK_PAYMENTS.filter(p => p.customerId === customerId).sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
}


// --- Notification Functions ---

export async function addNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  await delay(50);
  const newNotification: Notification = {
    ...notificationData,
    id: `notif_${Date.now()}`,
    createdAt: new Date(),
  };
  MOCK_NOTIFICATIONS.unshift(newNotification);
}

export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
    await delay(200);
    return MOCK_NOTIFICATIONS.filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    await delay(50);
    const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === notificationId);
    if (index !== -1) {
        MOCK_NOTIFICATIONS[index].isRead = true;
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    await delay(100);
    MOCK_NOTIFICATIONS.forEach(n => {
        if (n.userId === userId && !n.isRead) {
            n.isRead = true;
        }
    });
}
