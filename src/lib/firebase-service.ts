
import { db } from './firebase-config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  orderBy,
  limit,
  DocumentData,
} from 'firebase/firestore';

import type { Customer, WaterUsageRecord, Payment, Notification } from '@/types';

// --- Type Guards and Converters ---

function toCustomer(data: DocumentData, id: string): Customer {
  return {
    id,
    name: data.name,
    email: data.email,
    contactInfo: data.contactInfo,
    authUID: data.authUID,
    createdAt: data.createdAt.toDate(),
    balance: data.balance,
  };
}

function toWaterUsageRecord(data: DocumentData, id: string): WaterUsageRecord {
    return {
        id,
        customerId: data.customerId,
        customerName: data.customerName,
        date: data.date.toDate(),
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
        durationHours: data.durationHours,
        cost: data.cost,
        recordedBy: data.recordedBy,
        createdAt: data.createdAt.toDate(),
    };
}

function toPayment(data: DocumentData, id: string): Payment {
    return {
        id,
        customerId: data.customerId,
        customerName: data.customerName,
        paymentDate: data.paymentDate.toDate(),
        amountPaid: data.amountPaid,
        recordedBy: data.recordedBy,
        createdAt: data.createdAt.toDate(),
    };
}

function toNotification(data: DocumentData, id: string): Notification {
    return {
        id,
        userId: data.userId,
        message: data.message,
        type: data.type,
        isRead: data.isRead,
        linkTo: data.linkTo,
        createdAt: data.createdAt.toDate(),
    };
}


// --- Customer Functions ---

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  const docRef = await addDoc(collection(db, 'customers'), {
    ...customerData,
    createdAt: serverTimestamp() // Let Firestore set the timestamp
  });
  const newCustomer: Customer = {
      ...customerData,
      id: docRef.id,
      createdAt: new Date(), // Use current date for immediate UI update
  };
  return newCustomer;
}

export async function getAllCustomers(): Promise<Customer[]> {
  const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => toCustomer(doc.data(), doc.id));
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const docRef = doc(db, 'customers', customerId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? toCustomer(docSnap.data(), docSnap.id) : null;
}

export async function getCustomerByAuthUID(authUID: string): Promise<Customer | null> {
  const q = query(collection(db, "customers"), where("authUID", "==", authUID), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return toCustomer(docSnap.data(), docSnap.id);
  }
  return null;
}


export async function updateCustomer(customerId: string, customerUpdate: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, 'customers', customerId);
  await updateDoc(docRef, customerUpdate);
}

export async function deleteCustomer(customerId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // 1. Delete the customer document
    const customerRef = doc(db, 'customers', customerId);
    batch.delete(customerRef);

    // 2. Delete associated usage records
    const usageQuery = query(collection(db, 'usageRecords'), where('customerId', '==', customerId));
    const usageSnapshot = await getDocs(usageQuery);
    usageSnapshot.forEach(doc => batch.delete(doc.ref));

    // 3. Delete associated payments
    const paymentsQuery = query(collection(db, 'payments'), where('customerId', '==', customerId));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

    // 4. TODO: Delete associated notifications, requires customer authUID before deletion.
    // This part is complex because we need to fetch the customer doc first to get the authUID.
    // For simplicity in this service, we might skip notification deletion or handle it in a cloud function.

    // 5. TODO: Delete the Firebase Auth user associated with the customer.
    // This MUST be done on the server-side using the Firebase Admin SDK.

    await batch.commit();
}


export async function getOutstandingCustomers(): Promise<Customer[]> {
    const q = query(collection(db, 'customers'), where('balance', '>', 0), orderBy('balance', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => toCustomer(doc.data(), doc.id));
}

// --- Usage Record Functions ---

export async function addUsageRecord(recordData: Omit<WaterUsageRecord, 'id' | 'createdAt'>): Promise<WaterUsageRecord> {
    const batch = writeBatch(db);

    // 1. Add the usage record
    const usageRef = doc(collection(db, 'usageRecords'));
    batch.set(usageRef, { ...recordData, createdAt: serverTimestamp() });

    // 2. Update customer balance
    const customerRef = doc(db, 'customers', recordData.customerId);
    const customerSnap = await getDoc(customerRef);
    if(customerSnap.exists()){
        const currentBalance = customerSnap.data().balance || 0;
        batch.update(customerRef, { balance: currentBalance + recordData.cost });
    }

    await batch.commit();

    const newRecord: WaterUsageRecord = {
        ...recordData,
        id: usageRef.id,
        createdAt: new Date(),
    };
    return newRecord;
}

export async function updateUsageRecord(recordId: string, updatedData: Partial<Omit<WaterUsageRecord, 'id' | 'createdAt' | 'customerId' | 'customerName' | 'recordedBy'>>): Promise<void> {
    const recordRef = doc(db, 'usageRecords', recordId);
    const oldRecordSnap = await getDoc(recordRef);
    if(!oldRecordSnap.exists()) throw new Error("Record not found");

    const oldRecord = toWaterUsageRecord(oldRecordSnap.data(), oldRecordSnap.id);
    const costDifference = (updatedData.cost ?? oldRecord.cost) - oldRecord.cost;

    const batch = writeBatch(db);
    batch.update(recordRef, updatedData);

    if(costDifference !== 0) {
        const customerRef = doc(db, 'customers', oldRecord.customerId);
        const customerSnap = await getDoc(customerRef);
        if(customerSnap.exists()){
            const currentBalance = customerSnap.data().balance || 0;
            batch.update(customerRef, { balance: currentBalance + costDifference });
        }
    }
    
    await batch.commit();
}


export async function getAllUsageRecords(): Promise<WaterUsageRecord[]> {
  const q = query(collection(db, 'usageRecords'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => toWaterUsageRecord(doc.data(), doc.id));
}

export async function getUsageRecordsByCustomerId(customerId: string): Promise<WaterUsageRecord[]> {
  const q = query(collection(db, 'usageRecords'), where('customerId', '==', customerId), orderBy('startTime', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => toWaterUsageRecord(doc.data(), doc.id));
}

// --- Payment Functions ---

export async function addPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const batch = writeBatch(db);

    // 1. Add the payment record
    const paymentRef = doc(collection(db, 'payments'));
    batch.set(paymentRef, { ...paymentData, createdAt: serverTimestamp() });

    // 2. Update customer balance
    const customerRef = doc(db, 'customers', paymentData.customerId);
    const customerSnap = await getDoc(customerRef);
    if(customerSnap.exists()){
        const currentBalance = customerSnap.data().balance || 0;
        batch.update(customerRef, { balance: currentBalance - paymentData.amountPaid });
    }
    
    await batch.commit();

    const newPayment: Payment = {
        ...paymentData,
        id: paymentRef.id,
        createdAt: new Date(),
    };
    return newPayment;
}

export async function updatePaymentRecord(paymentId: string, updatedData: Partial<Omit<Payment, 'id' | 'createdAt' | 'customerId' | 'customerName' | 'recordedBy'>>): Promise<void> {
    const paymentRef = doc(db, 'payments', paymentId);
    const oldPaymentSnap = await getDoc(paymentRef);
    if(!oldPaymentSnap.exists()) throw new Error("Payment record not found");

    const oldPayment = toPayment(oldPaymentSnap.data(), oldPaymentSnap.id);
    // If amount paid changes, we need to adjust the customer's balance.
    const amountDifference = oldPayment.amountPaid - (updatedData.amountPaid ?? oldPayment.amountPaid);

    const batch = writeBatch(db);
    batch.update(paymentRef, updatedData);

    if(amountDifference !== 0){
        const customerRef = doc(db, 'customers', oldPayment.customerId);
        const customerSnap = await getDoc(customerRef);
        if(customerSnap.exists()){
            const currentBalance = customerSnap.data().balance || 0;
            batch.update(customerRef, { balance: currentBalance + amountDifference });
        }
    }

    await batch.commit();
}


export async function getAllPayments(): Promise<Payment[]> {
  const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => toPayment(doc.data(), doc.id));
}

export async function getPaymentsByCustomerId(customerId: string): Promise<Payment[]> {
  const q = query(collection(db, 'payments'), where('customerId', '==', customerId), orderBy('paymentDate', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => toPayment(doc.data(), doc.id));
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
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => toNotification(doc.data(), doc.id));
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, { isRead: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const batch = writeBatch(db);
  const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach(doc => {
    batch.update(doc.ref, { isRead: true });
  });
  await batch.commit();
}
