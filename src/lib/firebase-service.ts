
import { db, firebaseAuth } from './firebase-config';
import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    writeBatch,
    serverTimestamp,
    Timestamp,
    setDoc
} from 'firebase/firestore';
import type { User, Customer, WaterUsageRecord, Payment, Notification } from '@/types';
import { sendPasswordResetEmail } from 'firebase/auth';

// Helper to convert Firestore Timestamps
const fromFirestore = <T extends { createdAt?: any; date?: any; startTime?: any; endTime?: any; paymentDate?: any; }>(docData: T): Omit<T, 'createdAt' | 'date' | 'startTime' | 'endTime' | 'paymentDate'> & { createdAt?: Date; date?: Date; startTime?: Date; endTime?: Date; paymentDate?: Date; } => {
    const data = { ...docData };
    if (data.createdAt && data.createdAt instanceof Timestamp) {
        data.createdAt = data.createdAt.toDate();
    }
    if (data.date && data.date instanceof Timestamp) {
        data.date = data.date.toDate();
    }
    if (data.startTime && data.startTime instanceof Timestamp) {
        data.startTime = data.startTime.toDate();
    }
     if (data.endTime && data.endTime instanceof Timestamp) {
        data.endTime = data.endTime.toDate();
    }
    if (data.paymentDate && data.paymentDate instanceof Timestamp) {
        data.paymentDate = data.paymentDate.toDate();
    }
    return data;
};


// --- User Management ---
export async function getUserProfile(userId: string): Promise<User | null> {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const role = data.role === 'admin' ? 'admin' : 'viewer';
        return fromFirestore({ id: userDocSnap.id, ...data, role } as User);
    }
    return null;
}

export async function addUserProfile(userData: User): Promise<void> {
    const userDocRef = doc(db, 'users', userData.id);
    await setDoc(userDocRef, {
        email: userData.email,
        role: userData.role,
        name: userData.name,
        avatarUrl: userData.avatarUrl || null,
    }, { merge: true });
}

export async function isAdminUser(userId: string): Promise<boolean> {
    if (!userId) return false;
    const adminDocRef = doc(db, 'admins', userId);
    const adminDocSnap = await getDoc(adminDocRef);
    return adminDocSnap.exists();
}


// --- Customer Functions ---
export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'balance'>): Promise<Customer> {
    const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        balance: 0,
        createdAt: serverTimestamp(),
    });
    return {
        id: docRef.id,
        ...customerData,
        balance: 0,
        createdAt: new Date(), // Approximate, actual value is on server
    };
}

export async function getAllCustomers(): Promise<Customer[]> {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore({ id: doc.id, ...doc.data() } as Customer));
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
    const docRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return fromFirestore({ id: docSnap.id, ...docSnap.data() } as Customer);
    }
    return null;
}

export async function getCustomerByAuthUID(authUID: string): Promise<Customer | null> {
    const q = query(collection(db, 'customers'), where('authUID', '==', authUID));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return fromFirestore({ id: docSnap.id, ...docSnap.data() } as Customer);
    }
    return null;
}

export async function updateCustomerInDb(customerId: string, customerUpdate: Partial<Omit<Customer, 'id'>>): Promise<void> {
    const docRef = doc(db, 'customers', customerId);
    await updateDoc(docRef, customerUpdate);
}

export async function deleteCustomer(customerId: string): Promise<void> {
    // This is a simplified deletion. For a production app, use a Cloud Function
    // to recursively delete subcollections (usageRecords, payments).
    const docRef = doc(db, 'customers', customerId);
    await deleteDoc(docRef);
}

export async function getOutstandingCustomers(): Promise<Customer[]> {
    const q = query(collection(db, 'customers'), where('balance', '>', 0), orderBy('balance', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore({ id: doc.id, ...doc.data() } as Customer));
}


// --- Usage Record Functions ---
export async function addUsageRecord(recordData: Omit<WaterUsageRecord, 'id' | 'createdAt'>): Promise<WaterUsageRecord> {
    const batch = writeBatch(db);
    
    const usageColRef = collection(db, `customers/${recordData.customerId}/usageRecords`);
    const newUsageRef = doc(usageColRef);
    batch.set(newUsageRef, {
        ...recordData,
        createdAt: serverTimestamp()
    });

    const customerDocRef = doc(db, 'customers', recordData.customerId);
    const customerDoc = await getDoc(customerDocRef);
    const currentBalance = customerDoc.data()?.balance || 0;
    batch.update(customerDocRef, { balance: currentBalance + recordData.cost });

    await batch.commit();

    return {
        id: newUsageRef.id,
        ...recordData,
        createdAt: new Date(),
    };
}

export async function updateUsageRecord(recordId: string, updatedData: Partial<Omit<WaterUsageRecord, 'id'>>): Promise<void> {
     if(!updatedData.customerId) throw new Error("Customer ID is required to update usage record.");

    const batch = writeBatch(db);
    const usageDocRef = doc(db, `customers/${updatedData.customerId}/usageRecords`, recordId);
    const oldUsageDoc = await getDoc(usageDocRef);
    const oldCost = oldUsageDoc.data()?.cost || 0;

    batch.update(usageDocRef, updatedData);

    const costDifference = (updatedData.cost ?? oldCost) - oldCost;
    if(costDifference !== 0) {
        const customerDocRef = doc(db, 'customers', updatedData.customerId);
        const customerDoc = await getDoc(customerDocRef);
        const currentBalance = customerDoc.data()?.balance || 0;
        batch.update(customerDocRef, { balance: currentBalance + costDifference });
    }
    
    await batch.commit();
}

export async function getAllUsageRecords(): Promise<WaterUsageRecord[]> {
    const usageRecordsGroup = collection(db, 'usageRecords');
    const q = query(usageRecordsGroup, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore({ id: doc.id, ...doc.data() } as WaterUsageRecord));
}

export async function getUsageRecordsByCustomerId(customerId: string): Promise<WaterUsageRecord[]> {
    const q = query(collection(db, `customers/${customerId}/usageRecords`), orderBy('startTime', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore({ id: doc.id, ...doc.data() } as WaterUsageRecord));
}


// --- Payment Functions ---
export async function addPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const batch = writeBatch(db);

    const paymentColRef = collection(db, `customers/${paymentData.customerId}/payments`);
    const newPaymentRef = doc(paymentColRef);
    batch.set(newPaymentRef, {
        ...paymentData,
        createdAt: serverTimestamp()
    });

    const customerDocRef = doc(db, 'customers', paymentData.customerId);
    const customerDoc = await getDoc(customerDocRef);
    const currentBalance = customerDoc.data()?.balance || 0;
    batch.update(customerDocRef, { balance: currentBalance - paymentData.amountPaid });
    
    await batch.commit();

    return {
        id: newPaymentRef.id,
        ...paymentData,
        createdAt: new Date(),
    };
}

export async function updatePaymentRecord(paymentId: string, updatedData: Partial<Omit<Payment, 'id'>>): Promise<void> {
    if(!updatedData.customerId) throw new Error("Customer ID is required to update payment record.");

    const batch = writeBatch(db);
    const paymentDocRef = doc(db, `customers/${updatedData.customerId}/payments`, paymentId);
    const oldPaymentDoc = await getDoc(paymentDocRef);
    const oldAmount = oldPaymentDoc.data()?.amountPaid || 0;

    batch.update(paymentDocRef, updatedData);

    const balanceAdjustment = oldAmount - (updatedData.amountPaid ?? oldAmount);

    if (balanceAdjustment !== 0) {
        const customerDocRef = doc(db, 'customers', updatedData.customerId);
        const customerDoc = await getDoc(customerDocRef);
        const currentBalance = customerDoc.data()?.balance || 0;
        batch.update(customerDocRef, { balance: currentBalance + balanceAdjustment });
    }

    await batch.commit();
}


export async function getAllPayments(): Promise<Payment[]> {
    const paymentsGroup = collection(db, 'payments');
    const q = query(paymentsGroup, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore({ id: doc.id, ...doc.data() } as Payment));
}

export async function getPaymentsByCustomerId(customerId: string): Promise<Payment[]> {
    const q = query(collection(db, `customers/${customerId}/payments`), orderBy('paymentDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore({ id: doc.id, ...doc.data() } as Payment));
}

// --- Notification Functions ---
export async function addNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdAt: serverTimestamp(),
    });
}

export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore({ id: doc.id, ...doc.data() } as Notification));
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { isRead: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const batch = writeBatch(db);
    const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', userId),
        where('isRead', '==', false)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
}

// --- Auth Actions ---
export async function sendPasswordReset(email: string): Promise<{success: boolean, error?: string}> {
    try {
        await sendPasswordResetEmail(firebaseAuth, email);
        return { success: true };
    } catch(error: any) {
        console.error("Password reset email failed:", error);
        
        let errorMessage = "An unknown error occurred. Please try again.";
        if (error.code === 'auth/invalid-email') {
            errorMessage = "The email address is not valid.";
        } else if (error.code === 'auth/user-not-found') {
            // For security, we don't want to confirm if a user exists.
            // The success message in the UI will handle this gracefully.
            // But we can log the real error.
            console.warn(`Password reset attempted for non-existent user: ${email}`);
            // We can return success here so the UI shows the "email sent" message, preventing user enumeration.
            return { success: true };
        }
        return { success: false, error: errorMessage };
    }
}
