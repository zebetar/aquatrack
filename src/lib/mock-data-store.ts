
import type { Customer, WaterUsageRecord, Payment, Notification } from '@/types';

// This file is configured for a full MOCK data flow.
// All data is stored in the browser's localStorage to simulate a database.
// This is ideal for rapid development and UI testing without needing a live backend.

const STORAGE_KEY = 'aquaTrackMockDataStore';

interface MockDataStore {
  customers: Customer[];
  usageRecords: WaterUsageRecord[];
  payments: Payment[];
  notifications: Notification[];
}

// Initialize a default store structure.
let store: MockDataStore = {
  customers: [],
  usageRecords: [],
  payments: [],
  notifications: [],
};

// --- Helper Functions ---

function loadStoreFromLocalStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const serializedStore = localStorage.getItem(STORAGE_KEY);
      if (serializedStore) {
        const parsedStore: MockDataStore = JSON.parse(serializedStore);

        // Revive dates from string format
        store.customers = parsedStore.customers?.map(c => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })) || [];
        store.usageRecords = parsedStore.usageRecords?.map(ur => ({
          ...ur,
          date: new Date(ur.date),
          startTime: new Date(ur.startTime),
          endTime: new Date(ur.endTime),
          createdAt: new Date(ur.createdAt),
        })) || [];
        store.payments = parsedStore.payments?.map(p => ({
          ...p,
          paymentDate: new Date(p.paymentDate),
          createdAt: new Date(p.createdAt),
        })) || [];
        store.notifications = parsedStore.notifications?.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt),
        })) || [];
      } else {
         // If no store exists, create some default data for a better first-run experience.
         createDefaultMockData();
         saveStoreToLocalStorage(); // Save the new default data
      }
    } catch (error) {
      console.error("Error loading or parsing mock data store from localStorage:", error);
      store = { customers: [], usageRecords: [], payments: [], notifications: [] };
    }
  }
}

function saveStoreToLocalStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const serializedStore = JSON.stringify(store);
      localStorage.setItem(STORAGE_KEY, serializedStore);
    } catch (error) {
      console.error("Error saving mock data store to localStorage:", error);
    }
  }
}

function createDefaultMockData(): void {
    const customer1: Customer = {
        id: 'cust-001',
        name: 'Alice Johnson',
        email: 'viewer@example.com',
        contactInfo: '123-456-7890',
        authUID: 'auth-001',
        createdAt: new Date(),
        balance: 1500,
    };
    const customer2: Customer = {
        id: 'cust-002',
        name: 'Bob Williams',
        email: 'bob@example.com',
        contactInfo: '098-765-4321',
        authUID: 'auth-002',
        createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
        balance: 0,
    };
    store.customers = [customer1, customer2];

    const usage1: WaterUsageRecord = {
        id: 'usage-001',
        customerId: 'cust-001',
        customerName: 'Alice Johnson',
        date: new Date(Date.now() - 86400000 * 2), // 2 days ago
        startTime: new Date(Date.now() - 86400000 * 2 - 3600000 * 2),
        endTime: new Date(Date.now() - 86400000 * 2),
        durationHours: 2,
        cost: 2400,
        recordedBy: 'admin001',
        createdAt: new Date(),
    };
    store.usageRecords = [usage1];

    const payment1: Payment = {
        id: 'payment-001',
        customerId: 'cust-001',
        customerName: 'Alice Johnson',
        paymentDate: new Date(Date.now() - 86400000), // yesterday
        amountPaid: 900,
        recordedBy: 'admin001',
        createdAt: new Date(),
    };
    store.payments = [payment1];

    const notif1: Notification = {
        id: 'noti-001-admin',
        userId: 'admin001',
        message: 'Welcome to AquaTrack! You can now manage your customers.',
        type: 'ANNOUNCEMENT',
        isRead: false,
        createdAt: new Date(),
    };
    const notif2: Notification = {
        id: 'noti-002-viewer',
        userId: 'auth-001',
        message: 'Welcome, Alice! Your account has been created.',
        type: 'ANNOUNCEMENT',
        isRead: false,
        linkTo: '/viewer/profile',
        createdAt: new Date(),
    };
    store.notifications = [notif1, notif2];
}


// Load the store from localStorage when the module is first imported
loadStoreFromLocalStorage();

// --- MOCK DATA FUNCTIONS ---

export function addMockCustomer(customer: Customer): void {
  store.customers.push(customer);
  saveStoreToLocalStorage();
}

export function getAllMockCustomers(): Customer[] {
  return [...store.customers].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMockCustomerById(customerId: string): Customer | null {
  const customer = store.customers.find(c => c.id === customerId);
  return customer ? { ...customer } : null;
}

export function getMockCustomerByEmail(email: string): Customer | null {
  if (!email) return null;
  const processedEmail = email.trim().toLowerCase();
  const customer = store.customers.find(c => c.email?.toLowerCase() === processedEmail);
  return customer ? { ...customer } : null;
}

export function updateMockCustomer(customerUpdate: Partial<Customer> & { id: string }): void {
  const customerIndex = store.customers.findIndex(c => c.id === customerUpdate.id);
  if (customerIndex > -1) {
    store.customers[customerIndex] = { ...store.customers[customerIndex], ...customerUpdate };
    saveStoreToLocalStorage();
  }
}

export function deleteMockCustomer(customerId: string): void {
  const customerToDelete = store.customers.find(c => c.id === customerId);
  if (customerToDelete) {
    store.customers = store.customers.filter(c => c.id !== customerId);
    store.usageRecords = store.usageRecords.filter(ur => ur.customerId !== customerId);
    store.payments = store.payments.filter(p => p.customerId !== customerId);
    if (customerToDelete.authUID) {
      store.notifications = store.notifications.filter(n => n.userId !== customerToDelete.authUID);
    }
    saveStoreToLocalStorage();
  }
}

export function getMockOutstandingCustomers(): Customer[] {
  return store.customers
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance);
}

export function addMockUsageRecord(record: WaterUsageRecord): void {
  store.usageRecords.unshift(record);
  const customerIndex = store.customers.findIndex(c => c.id === record.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance += record.cost;
  }
  saveStoreToLocalStorage();
}

export function updateMockUsageRecord(updatedRecord: WaterUsageRecord): void {
    const recordIndex = store.usageRecords.findIndex(r => r.id === updatedRecord.id);
    if (recordIndex > -1) {
        const oldRecord = store.usageRecords[recordIndex];
        const costDifference = updatedRecord.cost - oldRecord.cost;
        
        const customerIndex = store.customers.findIndex(c => c.id === updatedRecord.customerId);
        if (customerIndex > -1) {
            store.customers[customerIndex].balance += costDifference;
        }

        store.usageRecords[recordIndex] = updatedRecord;
        saveStoreToLocalStorage();
    }
}


export function getAllMockUsageRecords(): WaterUsageRecord[] {
  return [...store.usageRecords].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMockUsageRecordsByCustomerId(customerId: string): WaterUsageRecord[] {
  return store.usageRecords
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export function addMockPayment(payment: Payment): void {
  store.payments.unshift(payment);
  const customerIndex = store.customers.findIndex(c => c.id === payment.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance -= payment.amountPaid;
  }
  saveStoreToLocalStorage();
}

export function updateMockPaymentRecord(updatedPayment: Payment): void {
    const paymentIndex = store.payments.findIndex(p => p.id === updatedPayment.id);
    if (paymentIndex > -1) {
        const oldPayment = store.payments[paymentIndex];
        const amountDifference = oldPayment.amountPaid - updatedPayment.amountPaid;

        const customerIndex = store.customers.findIndex(c => c.id === updatedPayment.customerId);
        if (customerIndex > -1) {
            store.customers[customerIndex].balance += amountDifference;
        }
        
        store.payments[paymentIndex] = updatedPayment;
        saveStoreToLocalStorage();
    }
}

export function getAllMockPayments(): Payment[] {
  return [...store.payments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMockPaymentsByCustomerId(customerId: string): Payment[] {
  return store.payments
    .filter(p => p.customerId === customerId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

export function addMockNotification(notification: Notification): void {
  store.notifications.unshift(notification);
  if (store.notifications.length > 100) store.notifications.pop();
  saveStoreToLocalStorage();
}

export function getMockNotificationsByUserId(userId: string): Notification[] {
  return store.notifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllAdminNotifications(): Notification[] {
  return store.notifications.filter(n => n.userId === 'admin001').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markNotificationAsRead(notificationId: string, userId: string): void {
  const notificationIndex = store.notifications.findIndex(n => n.id === notificationId && n.userId === userId);
  if (notificationIndex > -1) {
    store.notifications[notificationIndex].isRead = true;
    saveStoreToLocalStorage();
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  store.notifications.forEach(n => {
    if (n.userId === userId && !n.isRead) n.isRead = true;
  });
  saveStoreToLocalStorage();
}

export function updateCustomerEmail(customerId: string, newEmail: string): void {
  const customerIndex = store.customers.findIndex(c => c.id === customerId);
  if (customerIndex > -1) {
    const processedNewEmail = newEmail.trim().toLowerCase();
    store.customers[customerIndex] = {
      ...store.customers[customerIndex],
      email: processedNewEmail,
    };
    saveStoreToLocalStorage();
  }
}

export function exportMockDataAsJSON(): string {
  return JSON.stringify(store, null, 2);
}

export function importMockDataFromJSON(jsonString: string): { success: boolean, message: string } {
  try {
    const parsedData = JSON.parse(jsonString);

    if (
      !('customers' in parsedData) ||
      !('usageRecords' in parsedData) ||
      !('payments' in parsedData) ||
      !('notifications' in parsedData)
    ) {
      throw new Error("Invalid or corrupted data file. Missing required sections.");
    }
    
    store = parsedData;
    
    saveStoreToLocalStorage();
    
    loadStoreFromLocalStorage();

    return { success: true, message: "Data imported successfully. The page will now reload." };
  } catch (error: any) {
    console.error("Error during data import:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Import failed: ${errorMessage}` };
  }
}
