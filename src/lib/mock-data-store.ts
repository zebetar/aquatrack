
import type { Customer, WaterUsageRecord, Payment, Notification } from '@/types';
import { Timestamp, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, writeBatch, orderBy, limit } from 'firebase/firestore'; // Added Firestore imports for illustration
// import { db } from '@/lib/firebase-config'; // Illustrative: you would import your initialized db

// --- Explanation for Firestore Integration ---
// This file currently uses localStorage for a mock client-side data store.
// To integrate Firestore:
// 1. Set up Firebase in your project (see firebase-config.ts example).
// 2. Initialize 'db' from getFirestore.
// 3. Replace localStorage logic in each function below with corresponding Firestore operations (CRUD).
// 4. Functions would become 'async' and return Promises.
// 5. Components calling these functions would need to 'await' results and handle loading states.
// 6. Dates: Firestore typically stores dates as Timestamps or ISO strings. Conversions would be needed.
//    - When saving: new Date() -> Timestamp.fromDate(new Date()) or .toISOString()
//    - When fetching: timestamp.toDate() or new Date(isoString)
// 7. Firestore Security Rules would be crucial for production to protect data.

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

loadStoreFromLocalStorage();


// --- Customer Functions ---
export function addMockCustomer(customer: Customer): void {
  // Firestore equivalent:
  // const customerForFirestore = { ...customer, createdAt: Timestamp.fromDate(customer.createdAt) };
  // const customerRef = doc(db, 'customers', customer.id);
  // await setDoc(customerRef, customerForFirestore);
  // Note: For a new customer, Firestore can auto-generate an ID if you use addDoc(collection(db, 'customers'), customerForFirestore)

  const existingIndex = store.customers.findIndex(c => c.id === customer.id);
  if (existingIndex > -1) {
    store.customers[existingIndex] = { ...store.customers[existingIndex], ...customer };
  } else {
    store.customers.push(customer);
  }
  saveStoreToLocalStorage();
}

export function updateMockCustomer(updatedCustomer: Customer): void {
  // Firestore equivalent:
  // const customerForFirestore = { ...updatedCustomer, createdAt: Timestamp.fromDate(updatedCustomer.createdAt) };
  // const customerRef = doc(db, 'customers', updatedCustomer.id);
  // await updateDoc(customerRef, customerForFirestore); // Or setDoc with merge:true

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
  // Firestore equivalent:
  // const customerRef = doc(db, 'customers', customerId);
  // const docSnap = await getDoc(customerRef);
  // if (docSnap.exists()) {
  //   const data = docSnap.data();
  //   return { ...data, id: docSnap.id, createdAt: data.createdAt.toDate() } as Customer;
  // }
  // return undefined;

  return store.customers.find(c => c.id === customerId);
}

export function getAllMockCustomers(): Customer[] {
  // Firestore equivalent:
  // const customersCol = collection(db, 'customers');
  // const q = query(customersCol, orderBy('createdAt', 'desc')); // Example ordering
  // const customerSnapshot = await getDocs(q);
  // return customerSnapshot.docs.map(doc => {
  //   const data = doc.data();
  //   return { ...data, id: doc.id, createdAt: data.createdAt.toDate() } as Customer;
  // });

  return [...store.customers];
}

export function updateCustomerEmail(customerId: string, newEmail: string): void {
  // Firestore equivalent:
  // const customerRef = doc(db, 'customers', customerId);
  // await updateDoc(customerRef, { email: newEmail.trim().toLowerCase() });
  // Also, update Firebase Auth user email if using Firebase Auth.

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
  // Firestore equivalent (using a batch for atomicity):
  // const batch = writeBatch(db);
  // const customerRef = doc(db, 'customers', customerId);
  // batch.delete(customerRef);
  //
  // // Delete associated usage records (query for them first)
  // const usageQuery = query(collection(db, 'usageRecords'), where('customerId', '==', customerId));
  // const usageSnapshot = await getDocs(usageQuery);
  // usageSnapshot.forEach(doc => batch.delete(doc.ref));
  //
  // // Delete associated payments (query for them first)
  // const paymentQuery = query(collection(db, 'payments'), where('customerId', '==', customerId));
  // const paymentSnapshot = await getDocs(paymentQuery);
  // paymentSnapshot.forEach(doc => batch.delete(doc.ref));
  //
  // // Delete associated notifications (query for them first)
  // const notificationQuery = query(collection(db, 'notifications'), where('userId', '==', customerId)); // Assuming customerId is used as userId here
  // const notificationSnapshot = await getDocs(notificationQuery);
  // notificationSnapshot.forEach(doc => batch.delete(doc.ref));
  //
  // await batch.commit();

  const initialCustomerCount = store.customers.length;
  store.customers = store.customers.filter(c => c.id !== customerId);
  
  if (store.customers.length < initialCustomerCount) {
    store.usageRecords = store.usageRecords.filter(ur => ur.customerId !== customerId);
    store.payments = store.payments.filter(p => p.customerId !== customerId);
    store.notifications = store.notifications.filter(n => n.userId === customerId || n.message.includes(`Customer ID: ${customerId}`));
    
    saveStoreToLocalStorage();
    console.log(`Customer ${customerId} and associated data deleted from mock store.`);
  } else {
    console.warn(`Attempted to delete non-existent customer ID: ${customerId}`);
  }
}


// --- Water Usage Record Functions ---
export function addMockUsageRecord(record: WaterUsageRecord): void {
  // Firestore equivalent (could be a subcollection or top-level):
  // const recordForFirestore = {
  //   ...record,
  //   date: Timestamp.fromDate(record.date),
  //   startTime: Timestamp.fromDate(record.startTime),
  //   endTime: Timestamp.fromDate(record.endTime),
  //   createdAt: Timestamp.fromDate(record.createdAt),
  // };
  // await addDoc(collection(db, 'usageRecords'), recordForFirestore); // Firestore auto-generates ID
  //
  // // Update customer balance (ideally in a transaction or Cloud Function for consistency)
  // const customerRef = doc(db, 'customers', record.customerId);
  // const customerSnap = await getDoc(customerRef);
  // if (customerSnap.exists()) {
  //   const currentBalance = customerSnap.data().balance || 0;
  //   await updateDoc(customerRef, { balance: currentBalance + record.cost });
  // }

  store.usageRecords.push(record);
  const customerIndex = store.customers.findIndex(c => c.id === record.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance += record.cost;
  }
  saveStoreToLocalStorage();
}

export function updateMockUsageRecord(updatedRecord: WaterUsageRecord): void {
  // Firestore equivalent:
  // const recordForFirestore = {
  //   ...updatedRecord,
  //   date: Timestamp.fromDate(updatedRecord.date),
  //   startTime: Timestamp.fromDate(updatedRecord.startTime),
  //   endTime: Timestamp.fromDate(updatedRecord.endTime),
  //   createdAt: Timestamp.fromDate(updatedRecord.createdAt), // createdAt usually doesn't change on update
  // };
  // const usageRef = doc(db, 'usageRecords', updatedRecord.id);
  //
  // // Get old record to calculate balance difference (or do this in a transaction/Cloud Function)
  // const oldDocSnap = await getDoc(usageRef);
  // if (oldDocSnap.exists()) {
  //   const oldCost = oldDocSnap.data().cost;
  //   const costDifference = updatedRecord.cost - oldCost;
  //   const customerRef = doc(db, 'customers', updatedRecord.customerId);
  //   const customerSnap = await getDoc(customerRef);
  //   if (customerSnap.exists()) {
  //     const currentBalance = customerSnap.data().balance || 0;
  //     await updateDoc(customerRef, { balance: currentBalance + costDifference });
  //   }
  // }
  // await updateDoc(usageRef, recordForFirestore);


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
  // Firestore equivalent:
  // const q = query(collection(db, 'usageRecords'), where('customerId', '==', customerId), orderBy('startTime', 'desc'));
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => {
  //   const data = doc.data();
  //   return {
  //     ...data,
  //     id: doc.id,
  //     date: data.date.toDate(),
  //     startTime: data.startTime.toDate(),
  //     endTime: data.endTime.toDate(),
  //     createdAt: data.createdAt.toDate(),
  //   } as WaterUsageRecord;
  // });

  return store.usageRecords
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export function getAllMockUsageRecords(): WaterUsageRecord[] {
  // Firestore equivalent:
  // const q = query(collection(db, 'usageRecords'), orderBy('createdAt', 'desc'));
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => { /* ... convert dates ... */ } as WaterUsageRecord);

  return [...store.usageRecords].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// --- Payment Functions ---
export function addMockPayment(payment: Payment): void {
  // Firestore equivalent:
  // const paymentForFirestore = {
  //   ...payment,
  //   paymentDate: Timestamp.fromDate(payment.paymentDate),
  //   createdAt: Timestamp.fromDate(payment.createdAt),
  // };
  // await addDoc(collection(db, 'payments'), paymentForFirestore);
  //
  // // Update customer balance (transaction or Cloud Function preferred)
  // const customerRef = doc(db, 'customers', payment.customerId);
  // const customerSnap = await getDoc(customerRef);
  // if (customerSnap.exists()) {
  //   const currentBalance = customerSnap.data().balance || 0;
  //   await updateDoc(customerRef, { balance: currentBalance - payment.amountPaid });
  // }

  store.payments.push(payment);
  const customerIndex = store.customers.findIndex(c => c.id === payment.customerId);
  if (customerIndex > -1) {
    store.customers[customerIndex].balance -= payment.amountPaid;
  }
  saveStoreToLocalStorage();
}

export function updateMockPaymentRecord(updatedPayment: Payment): void {
  // Firestore equivalent:
  // const paymentForFirestore = { /* ... convert dates ... */ };
  // const paymentRef = doc(db, 'payments', updatedPayment.id);
  //
  // // Adjust balance (transaction or Cloud Function preferred)
  // const oldPaymentSnap = await getDoc(paymentRef);
  // if (oldPaymentSnap.exists()) {
  //   const oldAmount = oldPaymentSnap.data().amountPaid;
  //   const amountDifference = oldAmount - updatedPayment.amountPaid; // if new payment is less, diff is positive (add back)
  //   const customerRef = doc(db, 'customers', updatedPayment.customerId);
  //   const customerSnap = await getDoc(customerRef);
  //   if (customerSnap.exists()) {
  //     const currentBalance = customerSnap.data().balance || 0;
  //     await updateDoc(customerRef, { balance: currentBalance + amountDifference });
  //   }
  // }
  // await updateDoc(paymentRef, paymentForFirestore);

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
  // Firestore equivalent:
  // const q = query(collection(db, 'payments'), where('customerId', '==', customerId), orderBy('paymentDate', 'desc'));
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => { /* ... convert dates ... */ } as Payment);

  return store.payments
    .filter(p => p.customerId === customerId) 
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

export function getAllMockPayments(): Payment[] {
  // Firestore equivalent:
  // const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => { /* ... convert dates ... */ } as Payment);

  return [...store.payments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// --- Notification Functions ---
export function addMockNotification(notification: Notification): void {
  // Firestore equivalent:
  // const notificationForFirestore = { ...notification, createdAt: Timestamp.fromDate(notification.createdAt) };
  // await addDoc(collection(db, 'notifications'), notificationForFirestore);
  // Could also add TTL policies in Firestore for notifications if desired.

  store.notifications.unshift(notification);
  if (store.notifications.length > 100) {
    store.notifications.pop();
  }
  saveStoreToLocalStorage();
}

export function getMockNotificationsByUserId(userId: string): Notification[] {
  // Firestore equivalent:
  // const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(50)); // Example limit
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => { /* ... convert dates ... */ } as Notification);

  return store.notifications
    .filter(n => n.userId === userId)
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllAdminNotifications(): Notification[] {
  // Firestore equivalent would depend on how admin notifications are defined.
  // Could be by a specific admin userId, or a type, or a separate collection.
  // Example: query(collection(db, 'notifications'), where('userId', '==', 'admin001'), orderBy('createdAt', 'desc'))

  return store.notifications
    .filter(n => n.userId === 'admin001' || n.type === 'ANNOUNCEMENT' || n.type === 'CUSTOMER_ADDED' || n.type === 'CUSTOMER_UPDATED')
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markNotificationAsRead(notificationId: string, userId: string): void {
    // Firestore equivalent:
    // const notificationRef = doc(db, 'notifications', notificationId);
    // // Optional: Could add a check to ensure userId matches if rules don't cover it
    // await updateDoc(notificationRef, { isRead: true });

    const notificationIndex = store.notifications.findIndex(n => n.id === notificationId && n.userId === userId);
    if (notificationIndex > -1) {
        store.notifications[notificationIndex].isRead = true;
        saveStoreToLocalStorage();
    }
}

export function markAllNotificationsAsRead(userId: string): void {
    // Firestore equivalent (could be slow for many notifications, might need a Cloud Function for large scale):
    // const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
    // const snapshot = await getDocs(q);
    // const batch = writeBatch(db);
    // snapshot.docs.forEach(doc => batch.update(doc.ref, { isRead: true }));
    // await batch.commit();

    store.notifications.forEach(n => {
        if (n.userId === userId) {
            n.isRead = true;
        }
    });
    saveStoreToLocalStorage();
}


// --- Utility Functions ---
export function clearAllMockData(): void {
  // Firestore equivalent: This would be a much more complex operation,
  // typically done via a backend script or Firebase Console for safety.
  // Deleting all documents in all collections is destructive and usually restricted.

  store = {
    customers: [],
    usageRecords: [],
    payments: [],
    notifications: [],
  };
  saveStoreToLocalStorage();
  console.log("Mock data store cleared from memory and localStorage.");
}

