
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
    }
  } catch (error) {
    console.error("Error loading mock data store from localStorage:", error);
    // If error, initialize with empty store to prevent app crash
    store = { customers: [], usageRecords: [], payments: [] };
  }
}

function saveStoreToLocalStorage(): void {
  try {
    const serializedStore = JSON.stringify(store);
    localStorage.setItem(STORAGE_KEY, serializedStore);
    // console.log("Mock data store saved to localStorage.");
  } catch (error) {
    console.error("Error saving mock data store to localStorage:", error);
  }
}

// Load store from localStorage when the script is first imported/run
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
  return [...store.customers]; // Return a copy
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
  return [...store.usageRecords]; // Return a copy
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
  return [...store.payments]; // Return a copy
}

// --- Utility Functions ---
export function clearAllMockData(): void {
  store = {
    customers: [],
    usageRecords: [],
    payments: [],
  };
  saveStoreToLocalStorage(); // Also clear it from localStorage
  console.log("Mock data store cleared from memory and localStorage.");
}

// Optional: Log store changes for debugging
const logStore = (operation: string) => {
  // console.log(`Mock Store after ${operation}:`, JSON.parse(JSON.stringify(store)));
};

// Wrap add functions with logging if desired
const originalAddMockCustomer = addMockCustomer;
export const addMockCustomerLogged = (customer: Customer) => {
  originalAddMockCustomer(customer);
  logStore(`addMockCustomer: ${customer.id}`);
};
// Similar wrappers for other add functions if needed for debugging.
