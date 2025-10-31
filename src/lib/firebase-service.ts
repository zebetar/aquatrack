
import { db } from './firebase-config';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import type { Customer, WaterUsageRecord, Payment, Notification, User } from '@/types';


// Helper to convert Firestore Timestamps to Dates in a generic way
function convertDocTimestamps<T>(docData: any): T {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate();
    }
  }
  return data as T;
}

// --- User Functions ---

export async function getUserProfile(userId: string): Promise<User | null> {
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return { id: userDoc.id, ...convertDocTimestamps<User>(userDoc.data()) };
  }
  return null;
}


// --- Customer Functions ---

export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'balance'>): Promise<Customer> {
    const newCustomerRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        balance: 0,
        createdAt: Timestamp.now(),
    });
    
    const newCustomerDoc = await getDoc(newCustomerRef);
    return { id: newCustomerDoc.id, ...convertDocTimestamps<Omit<Customer, 'id'>>(newCustomerDoc.data()!) };
}


export async function getAllCustomers(): Promise<Customer[]> {
  const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...convertDocTimestamps<Omit<Customer, 'id'>>(doc.data()) }));
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const docRef = doc(db, 'customers', customerId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertDocTimestamps<Omit<Customer, 'id'>>(docSnap.data()) };
  }
  return null;
}

export async function getCustomerByAuthUID(authUID: string): Promise<Customer | null> {
  const q = query(collection(db, "customers"), where("authUID", "==", authUID));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...convertDocTimestamps<Omit<Customer, 'id'>>(docSnap.data()) };
  }
  return null;
}


export async function updateCustomer(customerId: string, customerUpdate: Partial<Omit<Customer, 'id'>>): Promise<void> {
    const docRef = doc(db, 'customers', customerId);
    await updateDoc(docRef, customerUpdate);
}

export async function deleteCustomer(customerId: string): Promise<void> {
    const batch = writeBatch(db);
    const customerDocRef = doc(db, 'customers', customerId);
    
    // Also delete their usage and payments for a clean delete
    const usageQuery = query(collection(db, 'usageRecords'), where('customerId', '==', customerId));
    const usageSnapshot = await getDocs(usageQuery);
    usageSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    const paymentQuery = query(collection(db, 'payments'), where('customerId', '==', customerId));
    const paymentSnapshot = await getDocs(paymentQuery);
    paymentSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    batch.delete(customerDocRef);
    await batch.commit();
}

export async function getOutstandingCustomers(): Promise<Customer[]> {
    const q = query(collection(db, 'customers'), where('balance', '>', 0), orderBy('balance', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...convertDocTimestamps<Omit<Customer, 'id'>>(doc.data()) }));
}


// --- Usage Record Functions ---

export async function addUsageRecord(recordData: Omit<WaterUsageRecord, 'id' | 'createdAt'>): Promise<WaterUsageRecord> {
  const newRecordRef = doc(collection(db, 'usageRecords'));
  const newRecord = {
    ...recordData,
    id: newRecordRef.id,
    createdAt: Timestamp.now(),
  };

  await runTransaction(db, async (transaction) => {
    const customerRef = doc(db, "customers", recordData.customerId);
    const customerDoc = await transaction.get(customerRef);
    if (!customerDoc.exists()) {
      throw "Customer does not exist!";
    }
    const newBalance = customerDoc.data().balance + recordData.cost;
    transaction.update(customerRef, { balance: newBalance });
    transaction.set(newRecordRef, { ...recordData, createdAt: Timestamp.now() });
  });

  return convertDocTimestamps<WaterUsageRecord>(newRecord);
}

export async function updateUsageRecord(recordId: string, updatedData: Partial<Omit<WaterUsageRecord, 'id'>>): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const recordRef = doc(db, "usageRecords", recordId);
        const recordDoc = await transaction.get(recordRef);

        if (!recordDoc.exists()) {
            throw "Usage record not found!";
        }

        const oldRecord = recordDoc.data() as WaterUsageRecord;
        const costDifference = (updatedData.cost ?? oldRecord.cost) - oldRecord.cost;

        if (costDifference !== 0) {
            const customerRef = doc(db, "customers", oldRecord.customerId);
            const customerDoc = await transaction.get(customerRef);
            if(customerDoc.exists()){
                const newBalance = customerDoc.data().balance + costDifference;
                transaction.update(customerRef, { balance: newBalance });
            }
        }
        transaction.update(recordRef, updatedData);
    });
}

export async function getAllUsageRecords(): Promise<WaterUsageRecord[]> {
  const q = query(collection(db, 'usageRecords'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...convertDocTimestamps<Omit<WaterUsageRecord, 'id'>>(doc.data()) }));
}

export async function getUsageRecordsByCustomerId(customerId: string): Promise<WaterUsageRecord[]> {
  const q = query(collection(db, 'usageRecords'), where('customerId', '==', customerId), orderBy('startTime', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...convertDocTimestamps<Omit<WaterUsageRecord, 'id'>>(doc.data()) }));
}


// --- Payment Functions ---

export async function addPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  const newPaymentRef = doc(collection(db, 'payments'));
  const newPayment = {
      ...paymentData,
      id: newPaymentRef.id,
      createdAt: Timestamp.now()
  }

  await runTransaction(db, async (transaction) => {
    const customerRef = doc(db, "customers", paymentData.customerId);
    const customerDoc = await transaction.get(customerRef);
    if (!customerDoc.exists()) {
      throw "Customer does not exist!";
    }
    const newBalance = customerDoc.data().balance - paymentData.amountPaid;
    transaction.update(customerRef, { balance: newBalance });
    transaction.set(newPaymentRef, { ...paymentData, createdAt: Timestamp.now() });
  });

  return convertDocTimestamps<Payment>(newPayment);
}

export async function updatePaymentRecord(paymentId: string, updatedData: Partial<Omit<Payment, 'id'>>): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const paymentRef = doc(db, "payments", paymentId);
        const paymentDoc = await transaction.get(paymentRef);
        if (!paymentDoc.exists()) {
            throw "Payment record not found!";
        }
        const oldPayment = paymentDoc.data() as Payment;
        const amountDifference = oldPayment.amountPaid - (updatedData.amountPaid ?? oldPayment.amountPaid);
        
        if (amountDifference !== 0) {
            const customerRef = doc(db, "customers", oldPayment.customerId);
            const customerDoc = await transaction.get(customerRef);
             if(customerDoc.exists()){
                const newBalance = customerDoc.data().balance + amountDifference;
                transaction.update(customerRef, { balance: newBalance });
            }
        }
        transaction.update(paymentRef, updatedData);
    });
}

export async function getAllPayments(): Promise<Payment[]> {
  const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...convertDocTimestamps<Omit<Payment, 'id'>>(doc.data()) }));
}

export async function getPaymentsByCustomerId(customerId: string): Promise<Payment[]> {
  const q = query(collection(db, 'payments'), where('customerId', '==', customerId), orderBy('paymentDate', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...convertDocTimestamps<Omit<Payment, 'id'>>(doc.data()) }));
}


// --- Notification Functions ---

export async function addNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    ...notificationData,
    createdAt: Timestamp.now(),
  });
}

export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...convertDocTimestamps<Omit<Notification, 'id'>>(doc.data()) }));
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { isRead: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
}
