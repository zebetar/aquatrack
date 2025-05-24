
import type { Customer, WaterUsageRecord, Payment } from '@/types';

interface MockDataStore {
  customers: Customer[];
  usageRecords: WaterUsageRecord[];
  payments: Payment[];
}

// Initialize store. This will be cleared on page refresh.
let store: MockDataStore = {
  customers: [],
  usageRecords: [],
  payments: [],
};

// --- Customer Functions ---
export function addMockCustomer(customer: Customer): void {
  const existingIndex = store.customers.findIndex(c => c.id === customer.id);
  if (existingIndex > -1) {
    // Update existing customer
    store.customers[existingIndex] = { ...store.customers[existingIndex], ...customer };
  } else {
    store.customers.push(customer);
  }
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
  // Update customer balance
  const customerIndex = store.customers.findIndex(c => c.id === record.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance += record.cost;
  }
}

export function getMockUsageRecordsByCustomerId(customerId: string): WaterUsageRecord[] {
  return store.usageRecords
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

// --- Payment Functions ---
export function addMockPayment(payment: Payment): void {
  store.payments.push(payment);
  // Update customer balance
  const customerIndex = store.customers.findIndex(c => c.id === payment.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance -= payment.amountPaid;
  }
}

export function getMockPaymentsByCustomerId(customerId: string): Payment[] {
  return store.payments
    .filter(p => p.customerId === payment.customerId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

// --- Utility Functions ---
export function clearAllMockData(): void {
  store = {
    customers: [],
    usageRecords: [],
    payments: [],
  };
  console.log("Mock data store cleared.");
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
