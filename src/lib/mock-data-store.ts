
import type { Customer, WaterUsageRecord, Payment, Notification } from '@/types';
import { db, Timestamp } from '@/lib/firebase-config';
import {
  collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc,
  writeBatch, orderBy, limit, increment
} from 'firebase/firestore';

interface MockDataStore {
  customers: Customer[];
  usageRecords: WaterUsageRecord[];
  payments: Payment[];
  notifications: Notification[];
}

const STORAGE_KEY = 'aquaTrackMockDataStore';

let store: MockDataStore = {
  customers: [],
  usageRecords: [],
  payments: [],
  notifications: [],
};

function loadStoreFromLocalStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const serializedStore = localStorage.getItem(STORAGE_KEY);
      if (serializedStore) {
        const parsedStore: MockDataStore = JSON.parse(serializedStore);

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

        console.log("Mock data store loaded from localStorage.");
      } else {
        console.log("No mock data found in localStorage, initializing empty store.");
        store = { customers: [], usageRecords: [], payments: [], notifications: [] };
      }
    } catch (error) {
      console.error("Error loading mock data store from localStorage:", error);
      store = { customers: [], usageRecords: [], payments: [], notifications: [] };
    }
  } else {
    console.warn("localStorage not available, mock data store will be in-memory for this session.");
    store = { customers: [], usageRecords: [], payments: [], notifications: [] };
  }
}

function saveStoreToLocalStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const serializedStore = JSON.stringify(store);
      localStorage.setItem(STORAGE_KEY, serializedStore);
    } catch (error)
      {
      console.error("Error saving mock data store to localStorage:", error);
    }
  }
}

// Initialize the store from localStorage when the module loads.
loadStoreFromLocalStorage();

// --- Firestore Functions (NEW) ---

export async function addCustomerToFirestore(customer: Customer): Promise<void> {
  try {
    const customerRef = doc(db, 'customers', customer.id);
    const customerDataForFirestore = {
      ...customer,
      createdAt: Timestamp.fromDate(customer.createdAt),
    };
    await setDoc(customerRef, customerDataForFirestore);
    console.log("Customer added to Firestore with ID: ", customer.id);
  } catch (e) {
    console.error("Error adding customer to Firestore: ", e);
    throw e;
  }
}

export async function getAllCustomersFromFirestore(): Promise<Customer[]> {
  try {
    const customersCol = collection(db, 'customers');
    const q = query(customersCol, orderBy('createdAt', 'desc'));
    const customerSnapshot = await getDocs(q);
    const customers = customerSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp).toDate()
      } as Customer;
    });
    return customers;
  } catch (e) {
    console.error("Error fetching all customers from Firestore: ", e);
    if ((e as any).code === 'failed-precondition') {
        console.error("ACTION REQUIRED: This Firestore query likely failed due to a MISSING COMPOSITE INDEX. Please check your browser's developer console for a Firebase error message that includes a DIRECT LINK to create the necessary index in your Firestore console. The index should be for the 'customers' collection, ordered by 'createdAt desc'.");
    }
    throw e;
  }
}


// --- Mock Data Functions (Existing) ---

export function addMockCustomer(customer: Customer): void {
  const existingIndex = store.customers.findIndex(c => c.id === customer.id);
  if (existingIndex > -1) {
    store.customers[existingIndex] = { ...store.customers[existingIndex], ...customer };
  } else {
    store.customers.push(customer);
  }
  saveStoreToLocalStorage();
}

export function updateMockCustomer(updatedCustomer: Customer): void {
  const customerIndex = store.customers.findIndex(c => c.id === updatedCustomer.id);
  if (customerIndex > -1) {
    store.customers[customerIndex] = { ...store.customers[customerIndex], ...updatedCustomer };
    saveStoreToLocalStorage();
    console.log(`Customer ${updatedCustomer.id} updated in mock store.`);
  } else {
    console.warn(`Attempted to update non-existent customer ID: ${updatedCustomer.id}`);
  }
}

export function getMockCustomerById(customerId: string): Customer | undefined {
  return store.customers.find(c => c.id === customerId);
}

export function getAllMockCustomers(): Customer[] {
  return [...store.customers];
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
    console.log(`Customer ${customerId} email updated in mock store to ${processedNewEmail}`);
  } else {
    console.warn(`Attempted to update email for non-existent customer ID: ${customerId}`);
  }
}

export function deleteMockCustomer(customerId: string): void {
  const initialCustomerCount = store.customers.length;
  const customerToDelete = store.customers.find(c => c.id === customerId);

  store.customers = store.customers.filter(c => c.id !== customerId);

  if (store.customers.length < initialCustomerCount && customerToDelete) {
    store.usageRecords = store.usageRecords.filter(ur => ur.customerId !== customerId);
    store.payments = store.payments.filter(p => p.customerId !== customerId);
    store.notifications = store.notifications.filter(n => {
        const isForThisUser = customerToDelete.authUID && n.userId === customerToDelete.authUID;
        const isAdminNotificationAboutThisUser = n.linkTo?.includes(`/admin/customers/${customerId}`);
        return !isForThisUser && !isAdminNotificationAboutThisUser;
    });

    saveStoreToLocalStorage();
    console.log(`Customer ${customerId} and associated data deleted from mock store.`);
  } else {
    console.warn(`Attempted to delete non-existent customer ID: ${customerId}`);
  }
}

export function addMockUsageRecord(record: WaterUsageRecord): void {
  store.usageRecords.push(record);
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
    const customerIndex = store.customers.findIndex(c => c.id === updatedRecord.customerId);

    if (customerIndex > -1) {
      const costDifference = updatedRecord.cost - oldRecord.cost;
      store.customers[customerIndex].balance += costDifference;
    }
    store.usageRecords[recordIndex] = { ...oldRecord, ...updatedRecord };
    saveStoreToLocalStorage();
  } else {
    console.warn(`Attempted to update non-existent usage record ID: ${updatedRecord.id}`);
  }
}

export function getMockUsageRecordsByCustomerId(customerId: string): WaterUsageRecord[] {
  return store.usageRecords
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export function getAllMockUsageRecords(): WaterUsageRecord[] {
  return [...store.usageRecords].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addMockPayment(payment: Payment): void {
  store.payments.push(payment);
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
    const customerIndex = store.customers.findIndex(c => c.id === updatedPayment.customerId);

    if (customerIndex > -1) {
      const amountDifference = oldPayment.amountPaid - updatedPayment.amountPaid;
      store.customers[customerIndex].balance += amountDifference;
    }
    store.payments[paymentIndex] = { ...oldPayment, ...updatedPayment };
    saveStoreToLocalStorage();
  } else {
    console.warn(`Attempted to update non-existent payment ID: ${updatedPayment.id}`);
  }
}

export function getMockPaymentsByCustomerId(customerId: string): Payment[] {
  return store.payments
    .filter(p => p.customerId === customerId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

export function getAllMockPayments(): Payment[] {
  return [...store.payments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addMockNotification(notification: Notification): void {
  store.notifications.unshift(notification);
  if (store.notifications.length > 100) {
    store.notifications.pop();
  }
  saveStoreToLocalStorage();
}

export function getMockNotificationsByUserId(userId: string): Notification[] {
  return store.notifications
    .filter(n => n.userId === userId)
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllAdminNotifications(): Notification[] {
  return store.notifications
    .filter(n => n.userId === 'admin001' )
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        if (n.userId === userId && !n.isRead) {
            n.isRead = true;
        }
    });
    saveStoreToLocalStorage();
}

export function clearAllMockData(): void {
  store.customers = [];
  store.usageRecords = [];
  store.payments = [];
  store.notifications = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(STORAGE_KEY);
  }
  console.log("Mock data store cleared from memory and localStorage.");
}

export function exportMockDataAsJSON(): string {
  return JSON.stringify(store, null, 2);
}
