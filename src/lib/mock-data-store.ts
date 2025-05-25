
import type { Customer, WaterUsageRecord, Payment, Notification } from '@/types';
// --- Firestore Import Examples (uncomment and use when ready) ---
// import { db, Timestamp } from '@/lib/firebase-config';
// import {
//   collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc,
//   writeBatch, orderBy, limit, increment
// } from 'firebase/firestore';

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

// --- Customer Functions ---

// Example of what addMockCustomer would look like with Firestore
/*
export async function addCustomerToFirestore(customer: Customer): Promise<void> {
  try {
    const customerRef = doc(db, 'customers', customer.id);
    // Convert Date objects to Firestore Timestamps for proper storage and querying
    const customerDataForFirestore = {
      ...customer,
      createdAt: Timestamp.fromDate(customer.createdAt), // Assuming Timestamp is imported from 'firebase/firestore'
    };
    await setDoc(customerRef, customerDataForFirestore);
    console.log("Customer added to Firestore with ID: ", customer.id);
  } catch (e) {
    console.error("Error adding customer to Firestore: ", e);
    throw e; // Re-throw to be handled by the caller
  }
}
*/
export function addMockCustomer(customer: Customer): void {
  const existingIndex = store.customers.findIndex(c => c.id === customer.id);
  if (existingIndex > -1) {
    store.customers[existingIndex] = { ...store.customers[existingIndex], ...customer };
  } else {
    store.customers.push(customer);
  }
  saveStoreToLocalStorage();
  // When using Firestore, you would call:
  // addCustomerToFirestore(customer).catch(console.error);
  // And your component would need to handle the async nature.
}

// Example for updateMockCustomer with Firestore
/*
export async function updateCustomerInFirestore(updatedCustomer: Customer): Promise<void> {
  try {
    const customerRef = doc(db, 'customers', updatedCustomer.id);
    const customerDataForFirestore = {
      ...updatedCustomer,
      createdAt: Timestamp.fromDate(updatedCustomer.createdAt),
    };
    await updateDoc(customerRef, customerDataForFirestore); // or setDoc with merge: true
    console.log(`Customer ${updatedCustomer.id} updated in Firestore.`);
  } catch (e) {
    console.error("Error updating customer in Firestore: ", e);
    throw e;
  }
}
*/
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

// Example for getMockCustomerById with Firestore
/*
export async function getCustomerByIdFromFirestore(customerId: string): Promise<Customer | undefined> {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(customerRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: (data.createdAt as Timestamp).toDate() // Convert Timestamp back to Date
      } as Customer;
    }
    return undefined;
  } catch (e) {
    console.error("Error fetching customer by ID from Firestore: ", e);
    throw e;
  }
}
*/
export function getMockCustomerById(customerId: string): Customer | undefined {
  return store.customers.find(c => c.id === customerId);
}

// Example for getAllMockCustomers with Firestore
/*
export async function getAllCustomersFromFirestore(): Promise<Customer[]> {
  try {
    const customersCol = collection(db, 'customers');
    // Example: order by createdAt descending
    const q = query(customersCol, orderBy('createdAt', 'desc'));
    const customerSnapshot = await getDocs(q);
    return customerSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp).toDate()
      } as Customer;
    });
  } catch (e) {
    console.error("Error fetching all customers from Firestore: ", e);
    throw e;
  }
}
*/
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
  // Firestore equivalent:
  // const customerRef = doc(db, 'customers', customerId);
  // await updateDoc(customerRef, { email: newEmail.trim().toLowerCase() });
}

// Example for deleteMockCustomer with Firestore (using a batch for atomicity)
/*
export async function deleteCustomerFromFirestore(customerId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const customerRef = doc(db, 'customers', customerId);
    batch.delete(customerRef);

    // Example: Deleting associated usage records (if stored as a top-level collection)
    const usageQuery = query(collection(db, 'usageRecords'), where('customerId', '==', customerId));
    const usageSnapshot = await getDocs(usageQuery);
    usageSnapshot.forEach(doc => batch.delete(doc.ref));

    // Example: Deleting associated payments
    const paymentQuery = query(collection(db, 'payments'), where('customerId', '==', customerId));
    const paymentSnapshot = await getDocs(paymentQuery);
    paymentSnapshot.forEach(doc => batch.delete(doc.ref));

    // Example: Deleting associated notifications
    // const customerData = await getCustomerByIdFromFirestore(customerId); // Fetch customer to get authUID
    // if (customerData?.authUID) {
    //   const notificationQuery = query(collection(db, 'notifications'), where('userId', '==', customerData.authUID));
    //   const notificationSnapshot = await getDocs(notificationQuery);
    //   notificationSnapshot.forEach(doc => batch.delete(doc.ref));
    // }

    await batch.commit();
    console.log(`Customer ${customerId} and associated data deleted from Firestore.`);
  } catch (e) {
    console.error("Error deleting customer from Firestore: ", e);
    throw e;
  }
}
*/
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


// --- Water Usage Record Functions ---
// Firestore: Dates (date, startTime, endTime, createdAt) should be Firestore Timestamps.
// Balance updates should ideally happen in a Firestore Transaction or Cloud Function.
export function addMockUsageRecord(record: WaterUsageRecord): void {
  store.usageRecords.push(record);
  const customerIndex = store.customers.findIndex(c => c.id === record.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance += record.cost;
  }
  saveStoreToLocalStorage();
  // Firestore Example:
  // const recordForFirestore = {
  //   ...record,
  //   date: Timestamp.fromDate(record.date),
  //   startTime: Timestamp.fromDate(record.startTime),
  //   endTime: Timestamp.fromDate(record.endTime),
  //   createdAt: Timestamp.fromDate(record.createdAt),
  // };
  // const usageCollectionRef = collection(db, 'usageRecords');
  // await addDoc(usageCollectionRef, recordForFirestore);
  // // Update customer balance
  // const customerRef = doc(db, 'customers', record.customerId);
  // await updateDoc(customerRef, { balance: increment(record.cost) });
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
  // Firestore Example:
  // const usageRecordRef = doc(db, 'usageRecords', updatedRecord.id);
  // const oldRecordSnap = await getDoc(usageRecordRef); // To calculate cost difference for balance
  // if (oldRecordSnap.exists()) {
  //   const oldCost = oldRecordSnap.data().cost;
  //   const costDifference = updatedRecord.cost - oldCost;
  //   const customerRef = doc(db, 'customers', updatedRecord.customerId);
  //   await updateDoc(customerRef, { balance: increment(costDifference) });
  // }
  // const updatedRecordForFirestore = { /* ...convert dates to Timestamps... */ };
  // await updateDoc(usageRecordRef, updatedRecordForFirestore);
}

export function getMockUsageRecordsByCustomerId(customerId: string): WaterUsageRecord[] {
  return store.usageRecords
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  // Firestore Example:
  // const q = query(
  //   collection(db, 'usageRecords'),
  //   where('customerId', '==', customerId),
  //   orderBy('startTime', 'desc')
  // );
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => { /* ... convert Timestamps to Dates ... */ } as WaterUsageRecord);
}

export function getAllMockUsageRecords(): WaterUsageRecord[] {
  return [...store.usageRecords].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // Firestore Example:
  // const q = query(collection(db, 'usageRecords'), orderBy('createdAt', 'desc'));
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => { /* ... convert Timestamps to Dates ... */ } as WaterUsageRecord);
}

// --- Payment Functions ---
// Firestore: paymentDate and createdAt should be Firestore Timestamps.
// Balance updates should ideally happen in a Firestore Transaction or Cloud Function.
export function addMockPayment(payment: Payment): void {
  store.payments.push(payment);
  const customerIndex = store.customers.findIndex(c => c.id === payment.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance -= payment.amountPaid;
  }
  saveStoreToLocalStorage();
  // Firestore Example:
  // const paymentForFirestore = {
  //   ...payment,
  //   paymentDate: Timestamp.fromDate(payment.paymentDate),
  //   createdAt: Timestamp.fromDate(payment.createdAt),
  // };
  // await addDoc(collection(db, 'payments'), paymentForFirestore);
  // // Update customer balance
  // const customerRef = doc(db, 'customers', payment.customerId);
  // await updateDoc(customerRef, { balance: increment(-payment.amountPaid) });
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
  // Firestore Example:
  // Similar logic to updateMockUsageRecord, involving fetching old record for balance adjustment.
}

export function getMockPaymentsByCustomerId(customerId: string): Payment[] {
  return store.payments
    .filter(p => p.customerId === customerId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  // Firestore Example:
  // const q = query(
  //   collection(db, 'payments'),
  //   where('customerId', '==', customerId),
  //   orderBy('paymentDate', 'desc')
  // );
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => { /* ... convert Timestamps to Dates ... */ } as Payment);
}

export function getAllMockPayments(): Payment[] {
  return [...store.payments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // Firestore Example:
  // const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => { /* ... convert Timestamps to Dates ... */ } as Payment);
}

// --- Notification Functions ---
// Firestore: createdAt should be a Firestore Timestamp.
export function addMockNotification(notification: Notification): void {
  store.notifications.unshift(notification);
  if (store.notifications.length > 100) {
    store.notifications.pop();
  }
  saveStoreToLocalStorage();
  // Firestore Example:
  // const notificationForFirestore = {
  //   ...notification,
  //   createdAt: Timestamp.fromDate(notification.createdAt)
  // };
  // await addDoc(collection(db, 'notifications'), notificationForFirestore);
}

export function getMockNotificationsByUserId(userId: string): Notification[] {
  return store.notifications
    .filter(n => n.userId === userId)
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // Firestore Example:
  // const q = query(
  //   collection(db, 'notifications'),
  //   where('userId', '==', userId),
  //   orderBy('createdAt', 'desc'),
  //   limit(50) // Example limit
  // );
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => { /* ... convert Timestamps to Dates ... */ } as Notification);
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
    // Firestore Example:
    // const notificationRef = doc(db, 'notifications', notificationId);
    // await updateDoc(notificationRef, { isRead: true });
}

export function markAllNotificationsAsRead(userId: string): void {
    store.notifications.forEach(n => {
        if (n.userId === userId && !n.isRead) {
            n.isRead = true;
        }
    });
    saveStoreToLocalStorage();
    // Firestore Example (batch update):
    // const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
    // const snapshot = await getDocs(q);
    // const batch = writeBatch(db);
    // snapshot.docs.forEach(doc => batch.update(doc.ref, { isRead: true }));
    // await batch.commit();
}


// --- Utility Functions ---
export function clearAllMockData(): void {
  store.customers = [];
  store.usageRecords = [];
  store.payments = [];
  store.notifications = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(STORAGE_KEY);
  }
  console.log("Mock data store cleared from memory and localStorage.");
  // For Firestore, this would be a complex operation, likely a backend script or manual console deletion.
}

export function exportMockDataAsJSON(): string {
  // Ensure the store is up-to-date from localStorage before exporting
  // loadStoreFromLocalStorage(); // No need to call here if store is already in sync
  return JSON.stringify(store, null, 2); // Pretty print JSON
}

    