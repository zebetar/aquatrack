
import type { Customer, WaterUsageRecord, Payment } from '@/types';

interface MockDataStore {
  customers: Customer[];
  usageRecords: WaterUsageRecord[];
  payments: Payment[];
}

const STORAGE_KEY = 'aquaTrackMockDataStore';

// Initialize store
let store: MockDataStore = {
  customers: [],
  usageRecords: [],
  payments: [],
};

function loadStoreFromLocalStorage(): void {
  try {
    const serializedStore = localStorage.getItem(STORAGE_KEY);
    if (serializedStore) {
      const parsedStore: MockDataStore = JSON.parse(serializedStore);
      
      // Convert date strings back to Date objects
      parsedStore.customers = parsedStore.customers.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }));
      parsedStore.usageRecords = parsedStore.usageRecords.map(ur => ({
        ...ur,
        date: new Date(ur.date),
        startTime: new Date(ur.startTime),
        endTime: new Date(ur.endTime),
        createdAt: new Date(ur.createdAt),
      }));
      parsedStore.payments = parsedStore.payments.map(p => ({
        ...p,
        paymentDate: new Date(p.paymentDate),
        createdAt: new Date(p.createdAt),
      }));
      
      store = parsedStore;
      console.log("Mock data store loaded from localStorage.");
    } else {
      console.log("No mock data found in localStorage, initializing empty store.");
      // Optionally initialize with some default data if the store is empty
      // seedInitialData(); 
    }
  } catch (error) {
    console.error("Error loading mock data store from localStorage:", error);
    store = { customers: [], usageRecords: [], payments: [] };
  }
}

function saveStoreToLocalStorage(): void {
  try {
    const serializedStore = JSON.stringify(store);
    localStorage.setItem(STORAGE_KEY, serializedStore);
  } catch (error)
    {
    console.error("Error saving mock data store to localStorage:", error);
  }
}

loadStoreFromLocalStorage();


// --- Customer Functions ---
export function addMockCustomer(customer: Customer): void {
  const existingIndex = store.customers.findIndex(c => c.id === customer.id);
  if (existingIndex > -1) {
    store.customers[existingIndex] = { ...store.customers[existingIndex], ...customer };
  } else {
    store.customers.push(customer);
  }
  saveStoreToLocalStorage();
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
    store.customers[customerIndex].email = newEmail;
    saveStoreToLocalStorage();
    console.log(`Customer ${customerId} email updated in mock store to ${newEmail}`);
  } else {
    console.warn(`Attempted to update email for non-existent customer ID: ${customerId}`);
  }
}


// --- Water Usage Record Functions ---
export function addMockUsageRecord(record: WaterUsageRecord): void {
  store.usageRecords.push(record);
  const customerIndex = store.customers.findIndex(c => c.id === record.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance += record.cost;
  }
  saveStoreToLocalStorage();
}

export function getMockUsageRecordsByCustomerId(customerId: string): WaterUsageRecord[] {
  return store.usageRecords
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export function getAllMockUsageRecords(): WaterUsageRecord[] {
  return [...store.usageRecords];
}

// --- Payment Functions ---
export function addMockPayment(payment: Payment): void {
  store.payments.push(payment);
  const customerIndex = store.customers.findIndex(c => c.id === payment.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance -= payment.amountPaid;
  }
  saveStoreToLocalStorage();
}

export function getMockPaymentsByCustomerId(customerId: string): Payment[] {
  return store.payments
    .filter(p => p.customerId === customerId) 
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

export function getAllMockPayments(): Payment[] {
  return [...store.payments];
}

// --- Utility Functions ---
export function clearAllMockData(): void {
  store = {
    customers: [],
    usageRecords: [],
    payments: [],
  };
  saveStoreToLocalStorage();
  console.log("Mock data store cleared from memory and localStorage.");
}
