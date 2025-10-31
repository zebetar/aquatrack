
import { db } from './firebase-config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import type { Customer, WaterUsageRecord, Payment, Notification, User } from '@/types';

// Helper to convert Firestore Timestamps to Dates in objects
function convertTimestamps<T>(obj: any): T {
    for (const key in obj) {
        if (obj[key] instanceof Timestamp) {
            obj[key] = obj[key].toDate();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            convertTimestamps(obj[key]);
        }
    }
    return obj as T;
}


// --- User Functions ---
export async function getUserProfile(userId: string): Promise<User | null> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...convertTimestamps<Omit<User, 'id'>>(userDoc.data()) };
}

// --- Customer Functions ---
export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'balance'>): Promise<Customer> {
    const newCustomerRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        balance: 0,
        createdAt: serverTimestamp(),
    });
    return {
        id: newCustomerRef.id,
        ...customerData,
        balance: 0,
        createdAt: new Date(),
    };
}

export async function getAllCustomers(): Promise<Customer[]> {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestamps<Customer>({ id: doc.id, ...doc.data() }));
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
    const docRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return convertTimestamps<Customer>({ id: docSnap.id, ...docSnap.data() });
}

export async function getCustomerByAuthUID(authUID: string): Promise<Customer | null> {
    const q = query(collection(db, 'customers'), where('authUID', '==', authUID));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return convertTimestamps<Customer>({ id: doc.id, ...doc.data() });
}

export async function updateCustomerInDb(customerId: string, customerUpdate: Partial<Omit<Customer, 'id'>>): Promise<void> {
    const docRef = doc(db, 'customers', customerId);
    await updateDoc(docRef, customerUpdate);
}


export async function deleteCustomer(customerId: string): Promise<void> {
    // This is a simplified delete. A real app might handle this in a Cloud Function
    // to ensure all sub-collections are deleted.
    await deleteDoc(doc(db, 'customers', customerId));
}

export async function getOutstandingCustomers(): Promise<Customer[]> {
    const q = query(collection(db, 'customers'), where('balance', '>', 0), orderBy('balance', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestamps<Customer>({ id: doc.id, ...doc.data() }));
}


// --- Usage Record Functions ---
export async function addUsageRecord(recordData: Omit<WaterUsageRecord, 'id' | 'createdAt'>): Promise<WaterUsageRecord> {
    const batch = writeBatch(db);

    const newRecordRef = doc(collection(db, 'usageRecords'));
    batch.set(newRecordRef, { ...recordData, createdAt: serverTimestamp() });

    const customerRef = doc(db, 'customers', recordData.customerId);
    const customerDoc = await getDoc(customerRef);
    if (customerDoc.exists()) {
        const currentBalance = customerDoc.data().balance || 0;
        batch.update(customerRef, { balance: currentBalance + recordData.cost });
    }

    await batch.commit();
    return { id: newRecordRef.id, ...recordData, createdAt: new Date() };
}

export async function updateUsageRecord(recordId: string, updatedData: Partial<Omit<WaterUsageRecord, 'id'>>): Promise<void> {
    const batch = writeBatch(db);
    const recordRef = doc(db, 'usageRecords', recordId);
    const oldRecordSnap = await getDoc(recordRef);
    
    if (!oldRecordSnap.exists()) throw new Error("Record not found");
    const oldRecord = oldRecordSnap.data() as WaterUsageRecord;

    const costDifference = (updatedData.cost ?? oldRecord.cost) - oldRecord.cost;

    batch.update(recordRef, updatedData);

    if (costDifference !== 0) {
        const customerRef = doc(db, 'customers', oldRecord.customerId);
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
            const currentBalance = customerSnap.data().balance || 0;
            batch.update(customerRef, { balance: currentBalance + costDifference });
        }
    }
    await batch.commit();
}


export async function getAllUsageRecords(): Promise<WaterUsageRecord[]> {
    const q = query(collection(db, 'usageRecords'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestamps<WaterUsageRecord>({ id: doc.id, ...doc.data() }));
}

export async function getUsageRecordsByCustomerId(customerId: string): Promise<WaterUsageRecord[]> {
    const q = query(collection(db, 'usageRecords'), where('customerId', '==', customerId), orderBy('startTime', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestamps<WaterUsageRecord>({ id: doc.id, ...doc.data() }));
}


// --- Payment Functions ---
export async function addPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const batch = writeBatch(db);

    const newPaymentRef = doc(collection(db, 'payments'));
    batch.set(newPaymentRef, { ...paymentData, createdAt: serverTimestamp() });
    
    const customerRef = doc(db, 'customers', paymentData.customerId);
    const customerDoc = await getDoc(customerRef);
    if (customerDoc.exists()) {
        const currentBalance = customerDoc.data().balance || 0;
        batch.update(customerRef, { balance: currentBalance - paymentData.amountPaid });
    }

    await batch.commit();
    return { id: newPaymentRef.id, ...paymentData, createdAt: new Date() };
}

export async function updatePaymentRecord(paymentId: string, updatedData: Partial<Omit<Payment, 'id'>>): Promise<void> {
    const batch = writeBatch(db);
    const paymentRef = doc(db, 'payments', paymentId);
    const oldPaymentSnap = await getDoc(paymentRef);

    if (!oldPaymentSnap.exists()) throw new Error("Payment record not found");
    const oldPayment = oldPaymentSnap.data() as Payment;
    
    // amountPaid is positive, so a larger new payment means balance should decrease more
    // (old - new)
    const balanceAdjustment = oldPayment.amountPaid - (updatedData.amountPaid ?? oldPayment.amountPaid);
    
    batch.update(paymentRef, updatedData);

    if (balanceAdjustment !== 0) {
        const customerRef = doc(db, 'customers', oldPayment.customerId);
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
            const currentBalance = customerSnap.data().balance || 0;
            batch.update(customerRef, { balance: currentBalance + balanceAdjustment });
        }
    }
    await batch.commit();
}

export async function getAllPayments(): Promise<Payment[]> {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestamps<Payment>({ id: doc.id, ...doc.data() }));
}

export async function getPaymentsByCustomerId(customerId: string): Promise<Payment[]> {
    const q = query(collection(db, 'payments'), where('customerId', '==', customerId), orderBy('paymentDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestamps<Payment>({ id: doc.id, ...doc.data() }));
}

// --- Notification Functions ---
export async function addNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    ...notificationData,
    createdAt: serverTimestamp(),
  });
}

export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestamps<Notification>({ id: doc.id, ...doc.data() }));
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { isRead: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
}
