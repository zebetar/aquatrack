
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
  if (typeof window !== 'undefined' && window.localStorage) {
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
        // Initialize with empty store if nothing is found
        store = { customers: [], usageRecords: [], payments: [] };
      }
    } catch (error) {
      console.error("Error loading mock data store from localStorage:", error);
      store = { customers: [], usageRecords: [], payments: [] };
    }
  } else {
    // Fallback for environments where localStorage is not available (e.g., SSR pre-hydration)
    console.warn("localStorage not available, mock data store will be in-memory for this session.");
    store = { customers: [], usageRecords: [], payments: [] };
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

// Load store on initial script execution
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
    // Ensure email property exists before assigning
    store.customers[customerIndex] = {
      ...store.customers[customerIndex],
      email: newEmail,
    };
    saveStoreToLocalStorage();
    console.log(`Customer ${customerId} email updated in mock store to ${newEmail}`);
  } else {
    console.warn(`Attempted to update email for non-existent customer ID: ${customerId}`);
  }
}

export function deleteMockCustomer(customerId: string): void {
  const initialCustomerCount = store.customers.length;
  store.customers = store.customers.filter(c => c.id !== customerId);
  
  if (store.customers.length < initialCustomerCount) {
    // Also remove associated usage records and payments
    store.usageRecords = store.usageRecords.filter(ur => ur.customerId !== customerId);
    store.payments = store.payments.filter(p => p.customerId !== customerId);
    
    saveStoreToLocalStorage();
    console.log(`Customer ${customerId} and associated data deleted from mock store.`);
  } else {
    console.warn(`Attempted to delete non-existent customer ID: ${customerId}`);
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
