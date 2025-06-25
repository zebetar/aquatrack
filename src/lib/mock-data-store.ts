
import type { Customer, WaterUsageRecord, Payment, Notification } from '@/types';
import { db, Timestamp } from '@/lib/firebase-config';
import {
  collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc,
  writeBatch, orderBy, limit, increment, runTransaction
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

// --- Helper Functions ---

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
      }
    } catch (error) {
      console.error("Error loading mock data store from localStorage:", error);
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

loadStoreFromLocalStorage();

// --- Firestore Functions ---

// CUSTOMERS
export async function addCustomerToFirestore(customer: Customer): Promise<void> {
  try {
    const customerRef = doc(db, 'customers', customer.id);
    const customerDataForFirestore = {
      ...customer,
      createdAt: Timestamp.fromDate(customer.createdAt),
    };
    await setDoc(customerRef, customerDataForFirestore);
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
    if ((e as any).code === 'failed-precondition') {
      console.error("ACTION REQUIRED: This Firestore query likely failed due to a MISSING COMPOSITE INDEX. Please check your browser's developer console for a Firebase error message that includes a DIRECT LINK to create the necessary index in your Firestore console. The index should be for the 'customers' collection, ordered by 'createdAt desc'.");
    }
    throw e;
  }
}

export async function getOutstandingCustomersFromFirestore(): Promise<Customer[]> {
  try {
    const customersCol = collection(db, 'customers');
    const q = query(customersCol, where('balance', '>', 0), orderBy('balance', 'desc'));
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
    console.error("Error fetching outstanding customers from Firestore: ", e);
    if ((e as any).code === 'failed-precondition') {
      console.error("ACTION REQUIRED: This Firestore query likely failed due to a MISSING COMPOSITE INDEX for 'customers' on fields 'balance > 0' and 'balance desc'. Please check your browser's developer console for a link to create it.");
    }
    throw e;
  }
}


export async function getCustomerByIdFromFirestore(customerId: string): Promise<Customer | null> {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await getDoc(customerRef);
    if (customerSnap.exists()) {
      const data = customerSnap.data();
      return {
        ...data,
        id: customerSnap.id,
        createdAt: (data.createdAt as Timestamp).toDate()
      } as Customer;
    }
    return null;
  } catch (e) {
    console.error(`Error fetching customer ${customerId} from Firestore:`, e);
    throw e;
  }
}

export async function updateCustomerInFirestore(customer: Partial<Customer> & { id: string }): Promise<void> {
    try {
        const customerRef = doc(db, 'customers', customer.id);
        await updateDoc(customerRef, customer);
    } catch (e) {
        console.error(`Error updating customer ${customer.id} in Firestore: `, e);
        throw e;
    }
}

export async function deleteCustomerAndRelatedDataFromFirestore(customerId: string): Promise<void> {
    try {
        const batch = writeBatch(db);

        const customerRef = doc(db, 'customers', customerId);
        batch.delete(customerRef);

        const usageQuery = query(collection(db, 'usageRecords'), where('customerId', '==', customerId));
        const usageSnapshot = await getDocs(usageQuery);
        usageSnapshot.forEach(doc => batch.delete(doc.ref));

        const paymentsQuery = query(collection(db, 'payments'), where('customerId', '==', customerId));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

        // Note: Notifications are not being deleted here to keep it simple.
        // In a real app, this might be handled by a Cloud Function.

        await batch.commit();
    } catch (e) {
        console.error(`Error deleting customer ${customerId} and related data from Firestore: `, e);
        throw e;
    }
}


// USAGE RECORDS
export async function addUsageRecordToFirestore(record: WaterUsageRecord): Promise<void> {
  const customerRef = doc(db, 'customers', record.customerId);
  const usageRecordRef = doc(db, 'usageRecords', record.id);
  
  const recordData = {
    ...record,
    createdAt: Timestamp.fromDate(record.createdAt),
    date: Timestamp.fromDate(record.date),
    startTime: Timestamp.fromDate(record.startTime),
    endTime: Timestamp.fromDate(record.endTime),
  };

  const batch = writeBatch(db);
  batch.set(usageRecordRef, recordData);
  batch.update(customerRef, { balance: increment(record.cost) });
  await batch.commit();
}

export async function getAllUsageRecordsFromFirestore(): Promise<WaterUsageRecord[]> {
  try {
    const usageCol = collection(db, 'usageRecords');
    const q = query(usageCol, orderBy('startTime', 'desc'));
    const usageSnapshot = await getDocs(q);
    return usageSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: (data.date as Timestamp).toDate(),
        startTime: (data.startTime as Timestamp).toDate(),
        endTime: (data.endTime as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as WaterUsageRecord;
    });
  } catch (e) {
    console.error("Error fetching all usage records from Firestore: ", e);
    if ((e as any).code === 'failed-precondition') {
      console.error("ACTION REQUIRED: This Firestore query likely failed due to a MISSING COMPOSITE INDEX for 'usageRecords' ordered by 'startTime desc'. Please check your browser's developer console for a link to create it.");
    }
    throw e;
  }
}

export async function getUsageRecordsForDateRangeFromFirestore(startDate: Date, endDate: Date): Promise<WaterUsageRecord[]> {
    try {
        const usageCol = collection(db, 'usageRecords');
        const q = query(usageCol, 
                        where('date', '>=', Timestamp.fromDate(startDate)), 
                        where('date', '<=', Timestamp.fromDate(endDate)),
                        orderBy('date', 'desc'));
        const usageSnapshot = await getDocs(q);
        return usageSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                date: (data.date as Timestamp).toDate(),
                startTime: (data.startTime as Timestamp).toDate(),
                endTime: (data.endTime as Timestamp).toDate(),
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as WaterUsageRecord;
        });
    } catch (e) {
        console.error("Error fetching usage records for date range from Firestore: ", e);
        if ((e as any).code === 'failed-precondition') {
            console.error("ACTION REQUIRED: This Firestore query likely failed due to a MISSING COMPOSITE INDEX. Please check your browser's developer console for a link to create it. The index should be on 'usageRecords' collection for 'date' (>=), 'date' (<=), and 'date' (desc).");
        }
        throw e;
    }
}

export async function getUsageRecordsByCustomerIdFromFirestore(customerId: string): Promise<WaterUsageRecord[]> {
  try {
    const usageCol = collection(db, 'usageRecords');
    const q = query(usageCol, where('customerId', '==', customerId), orderBy('startTime', 'desc'));
    const usageSnapshot = await getDocs(q);
    return usageSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: (data.date as Timestamp).toDate(),
        startTime: (data.startTime as Timestamp).toDate(),
        endTime: (data.endTime as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as WaterUsageRecord;
    });
  } catch (e) {
    console.error(`Error fetching usage records for customer ${customerId} from Firestore:`, e);
     if ((e as any).code === 'failed-precondition') {
        console.error("ACTION REQUIRED: This Firestore query likely failed due to a MISSING COMPOSITE INDEX. Please check your browser's developer console for a Firebase error message that includes a DIRECT LINK to create the necessary index in your Firestore console. The index should be for the 'usageRecords' collection, on fields 'customerId' and 'startTime desc'.");
    }
    throw e;
  }
}

export async function updateUsageRecordInFirestore(updatedRecord: WaterUsageRecord): Promise<void> {
  const usageRecordRef = doc(db, 'usageRecords', updatedRecord.id);
  const customerRef = doc(db, 'customers', updatedRecord.customerId);

  await runTransaction(db, async (transaction) => {
    const usageRecordSnap = await transaction.get(usageRecordRef);
    if (!usageRecordSnap.exists()) {
      throw `Usage Record ${updatedRecord.id} does not exist!`;
    }
    const oldRecordData = usageRecordSnap.data();
    const oldRecord = {
        ...oldRecordData,
        date: (oldRecordData.date as Timestamp).toDate(),
        startTime: (oldRecordData.startTime as Timestamp).toDate(),
        endTime: (oldRecordData.endTime as Timestamp).toDate(),
        createdAt: (oldRecordData.createdAt as Timestamp).toDate(),
    } as WaterUsageRecord
    
    const costDifference = updatedRecord.cost - oldRecord.cost;
    
    const recordDataForFirestore = {
      ...updatedRecord,
      createdAt: Timestamp.fromDate(updatedRecord.createdAt),
      date: Timestamp.fromDate(updatedRecord.date),
      startTime: Timestamp.fromDate(updatedRecord.startTime),
      endTime: Timestamp.fromDate(updatedRecord.endTime),
    };
    
    transaction.update(customerRef, { balance: increment(costDifference) });
    transaction.set(usageRecordRef, recordDataForFirestore);
  });
}

// PAYMENTS
export async function addPaymentToFirestore(payment: Payment): Promise<void> {
  const customerRef = doc(db, 'customers', payment.customerId);
  const paymentRef = doc(db, 'payments', payment.id);

  const paymentData = {
    ...payment,
    createdAt: Timestamp.fromDate(payment.createdAt),
    paymentDate: Timestamp.fromDate(payment.paymentDate),
  };

  const batch = writeBatch(db);
  batch.set(paymentRef, paymentData);
  batch.update(customerRef, { balance: increment(-payment.amountPaid) });
  await batch.commit();
}

export async function getAllPaymentsFromFirestore(): Promise<Payment[]> {
    try {
        const paymentsCol = collection(db, 'payments');
        const q = query(paymentsCol, orderBy('paymentDate', 'desc'));
        const paymentSnapshot = await getDocs(q);
        return paymentSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                paymentDate: (data.paymentDate as Timestamp).toDate(),
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Payment;
        });
    } catch (e) {
        console.error("Error fetching all payments from Firestore: ", e);
        if ((e as any).code === 'failed-precondition') {
            console.error("ACTION REQUIRED: This Firestore query likely failed due to a MISSING COMPOSITE INDEX for 'payments' ordered by 'paymentDate desc'. Please check your browser's developer console for a link to create it.");
        }
        throw e;
    }
}


export async function getPaymentsByCustomerIdFromFirestore(customerId: string): Promise<Payment[]> {
  try {
    const paymentsCol = collection(db, 'payments');
    const q = query(paymentsCol, where('customerId', '==', customerId), orderBy('paymentDate', 'desc'));
    const paymentSnapshot = await getDocs(q);
    return paymentSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        paymentDate: (data.paymentDate as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Payment;
    });
  } catch (e) {
    console.error(`Error fetching payments for customer ${customerId} from Firestore:`, e);
    if ((e as any).code === 'failed-precondition') {
        console.error("ACTION REQUIRED: This Firestore query likely failed due to a MISSING COMPOSITE INDEX. Please check your browser's developer console for a Firebase error message that includes a DIRECT LINK to create the necessary index in your Firestore console. The index should be for the 'payments' collection, on fields 'customerId' and 'paymentDate desc'.");
    }
    throw e;
  }
}

export async function updatePaymentRecordInFirestore(updatedPayment: Payment): Promise<void> {
  const paymentRecordRef = doc(db, 'payments', updatedPayment.id);
  const customerRef = doc(db, 'customers', updatedPayment.customerId);

  await runTransaction(db, async (transaction) => {
    const paymentRecordSnap = await transaction.get(paymentRecordRef);
    if (!paymentRecordSnap.exists()) {
      throw `Payment Record ${updatedPayment.id} does not exist!`;
    }
    const oldPaymentData = paymentRecordSnap.data();
    const oldPayment = {
        ...oldPaymentData,
        paymentDate: (oldPaymentData.paymentDate as Timestamp).toDate(),
        createdAt: (oldPaymentData.createdAt as Timestamp).toDate(),
    } as Payment;

    const amountDifference = oldPayment.amountPaid - updatedPayment.amountPaid;

    const paymentDataForFirestore = {
      ...updatedPayment,
      createdAt: Timestamp.fromDate(updatedPayment.createdAt),
      paymentDate: Timestamp.fromDate(updatedPayment.paymentDate),
    };

    transaction.update(customerRef, { balance: increment(amountDifference) });
    transaction.set(paymentRecordRef, paymentDataForFirestore);
  });
}

// NOTIFICATIONS
export async function addNotificationToFirestore(notification: Notification): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notification.id);
    const notificationData = {
        ...notification,
        createdAt: Timestamp.fromDate(notification.createdAt),
    };
    await setDoc(notificationRef, notificationData);
  } catch(e) {
    console.error(`Error adding notification ${notification.id} to Firestore:`, e);
    throw e;
  }
}

export async function getAdminNotificationsFromFirestore(): Promise<Notification[]> {
  try {
    const notificationsCol = collection(db, 'notifications');
    const q = query(notificationsCol, where('userId', '==', 'admin001'), orderBy('createdAt', 'desc'), limit(10));
    const notificationSnapshot = await getDocs(q);
    return notificationSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Notification;
    });
  } catch(e) {
    console.error("Error fetching admin notifications from Firestore: ", e);
     if ((e as any).code === 'failed-precondition') {
        console.error("ACTION REQUIRED: This Firestore query likely failed due to a MISSING COMPOSITE INDEX. Please check your browser's developer console for a link to create it. The index should be for the 'notifications' collection, on 'userId' and 'createdAt desc'.");
    }
    throw e;
  }
}


// --- Mock Data Functions (for parts of the app not yet migrated) ---

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

export function getAllMockCustomers(): Customer[] {
  return [...store.customers];
}

export function deleteMockCustomer(customerId: string): void {
  const initialCustomerCount = store.customers.length;
  const customerToDelete = store.customers.find(c => c.id === customerId);
  store.customers = store.customers.filter(c => c.id !== customerId);
  if (store.customers.length < initialCustomerCount && customerToDelete) {
    store.usageRecords = store.usageRecords.filter(ur => ur.customerId !== customerId);
    store.payments = store.payments.filter(p => p.customerId !== customerId);
    store.notifications = store.notifications.filter(n => !(customerToDelete.authUID && n.userId === customerToDelete.authUID) && !n.linkTo?.includes(`/admin/customers/${customerId}`));
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

export function getMockCustomerById(customerId: string): Customer | null {
  const customer = store.customers.find(c => c.id === customerId);
  return customer ? { ...customer } : null;
}

export function exportMockDataAsJSON(): string {
  // This function now only exports the mock parts of the store (notifications)
  // as other data is now live in Firestore.
  const mockStore = {
     notifications: store.notifications,
  };
  return JSON.stringify(mockStore, null, 2);
}
