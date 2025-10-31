

import { MOCK_USERS, MOCK_CUSTOMERS, MOCK_USAGE_RECORDS, MOCK_PAYMENTS, MOCK_NOTIFICATIONS } from './mock-data-store';
import type { User, Customer, WaterUsageRecord, Payment, Notification } from '@/types';
import { addDays, addHours, differenceInMinutes } from 'date-fns';
import { CORE_WATER_RATE_PER_HOUR } from './constants';


// --- User Management ---
export async function authenticateUser(email: string, password: string): Promise<User | null> {
    console.log(`Attempting to authenticate ${email}`);
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (user) {
        console.log(`Authentication successful for ${user.name}`);
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    console.log("Authentication failed");
    return null;
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (!user) return null;
  const { password, ...userToReturn } = user;
  return userToReturn;
}


// --- Customer Functions ---
export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'balance'>): Promise<Customer> {
    const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        ...customerData,
        balance: 0,
        createdAt: new Date(),
    };
    MOCK_CUSTOMERS.push(newCustomer);
    return newCustomer;
}

export async function getAllCustomers(): Promise<Customer[]> {
    return [...MOCK_CUSTOMERS].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
    return MOCK_CUSTOMERS.find(c => c.id === customerId) || null;
}

export async function getCustomerByAuthUID(authUID: string): Promise<Customer | null> {
    return MOCK_CUSTOMERS.find(c => c.authUID === authUID) || null;
}

export async function updateCustomerInDb(customerId: string, customerUpdate: Partial<Omit<Customer, 'id'>>): Promise<void> {
    const index = MOCK_CUSTOMERS.findIndex(c => c.id === customerId);
    if (index !== -1) {
        MOCK_CUSTOMERS[index] = { ...MOCK_CUSTOMERS[index], ...customerUpdate };
    }
}

export async function deleteCustomer(customerId: string): Promise<void> {
    const index = MOCK_CUSTOMERS.findIndex(c => c.id === customerId);
    if (index > -1) {
        MOCK_CUSTOMERS.splice(index, 1);
        // Also remove their usage, payments etc. in a real scenario
    }
}

export async function getOutstandingCustomers(): Promise<Customer[]> {
    return MOCK_CUSTOMERS.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);
}


// --- Usage Record Functions ---
export async function addUsageRecord(recordData: Omit<WaterUsageRecord, 'id' | 'createdAt'>): Promise<WaterUsageRecord> {
    const newRecord: WaterUsageRecord = {
        id: `usage_${Date.now()}`,
        ...recordData,
        createdAt: new Date(),
    };
    MOCK_USAGE_RECORDS.push(newRecord);

    const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === recordData.customerId);
    if (customerIndex !== -1) {
        MOCK_CUSTOMERS[customerIndex].balance += recordData.cost;
    }
    return newRecord;
}

export async function updateUsageRecord(recordId: string, updatedData: Partial<Omit<WaterUsageRecord, 'id'>>): Promise<void> {
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
    return [...MOCK_USAGE_RECORDS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getUsageRecordsByCustomerId(customerId: string): Promise<WaterUsageRecord[]> {
    return MOCK_USAGE_RECORDS
        .filter(r => r.customerId === customerId)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}


// --- Payment Functions ---
export async function addPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const newPayment: Payment = {
        id: `pay_${Date.now()}`,
        ...paymentData,
        createdAt: new Date(),
    };
    MOCK_PAYMENTS.push(newPayment);

    const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === paymentData.customerId);
    if (customerIndex !== -1) {
        MOCK_CUSTOMERS[customerIndex].balance -= paymentData.amountPaid;
    }
    return newPayment;
}

export async function updatePaymentRecord(paymentId: string, updatedData: Partial<Omit<Payment, 'id'>>): Promise<void> {
    const index = MOCK_PAYMENTS.findIndex(p => p.id === paymentId);
    if (index !== -1) {
        const oldPayment = MOCK_PAYMENTS[index];
        const balanceAdjustment = oldPayment.amountPaid - (updatedData.amountPaid ?? oldPayment.amountPaid);
        
        MOCK_PAYMENTS[index] = { ...oldPayment, ...updatedData };

        if (balanceAdjustment !== 0) {
            const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === oldPayment.customerId);
            if (customerIndex !== -1) {
                MOCK_CUSTOMERS[customerIndex].balance += balanceAdjustment;
            }
        }
    }
}


export async function getAllPayments(): Promise<Payment[]> {
    return [...MOCK_PAYMENTS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPaymentsByCustomerId(customerId: string): Promise<Payment[]> {
    return MOCK_PAYMENTS
        .filter(p => p.customerId === customerId)
        .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
}

// --- Notification Functions ---
export async function addNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    const newNotification: Notification = {
        id: `notif_${Date.now()}`,
        ...notificationData,
        createdAt: new Date(),
    };
    MOCK_NOTIFICATIONS.unshift(newNotification);
}

export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return MOCK_NOTIFICATIONS
        .filter(n => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = MOCK_NOTIFICATIONS.find(n => n.id === notificationId);
    if (notification) {
        notification.isRead = true;
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    MOCK_NOTIFICATIONS.forEach(n => {
        if (n.userId === userId && !n.isRead) {
            n.isRead = true;
        }
    });
}
