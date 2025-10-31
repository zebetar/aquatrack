
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Customer, WaterUsageRecord, Payment, Notification, User } from '@/types';
import { initializeAdminApp } from './firebase-admin-config';
import { subMonths, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { CORE_WATER_RATE_PER_HOUR } from './constants';

// This file contains server-side data access functions for Firestore.
// It uses the Firebase Admin SDK, which has privileged access.
// These functions should only be called from Server Components or Server Actions.

// Initialize the admin app when this module is loaded.
const adminApp = initializeAdminApp();
const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export async function seedDatabase(): Promise<void> {
  // Create admin user in Firebase Auth
  const adminEmail = 'admin@example.com';
  const adminPassword = 'password';
  let adminUserRecord;

  try {
    adminUserRecord = await auth.getUserByEmail(adminEmail);
    console.log('Admin user already exists.');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      adminUserRecord = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: 'AquaTrack Admin',
      });
      await auth.setCustomUserClaims(adminUserRecord.uid, { role: 'admin' });
      console.log('Successfully created new admin user:', adminUserRecord.uid);
    } else {
      throw error;
    }
  }

  const batch = db.batch();

  // Create a user document for the admin
  const adminUserDocRef = db.collection('users').doc(adminUserRecord.uid);
  batch.set(adminUserDocRef, {
    name: 'AquaTrack Admin',
    email: adminEmail,
    role: 'admin',
  });

  const customers: Omit<Customer, 'id' | 'balance'>[] = [
      { name: 'Alice Johnson', email: 'viewer@example.com', contactInfo: '123-456-7890', createdAt: new Date(Date.now() - 86400000 * 100) },
      { name: 'Bob Williams', email: 'bob@example.com', contactInfo: '098-765-4321', createdAt: new Date(Date.now() - 86400000 * 90) },
      { name: 'Charlie Brown', email: 'charlie@example.com', contactInfo: '555-111-2222', createdAt: new Date(Date.now() - 86400000 * 80) },
      { name: 'Diana Prince', email: 'diana@example.com', contactInfo: '555-333-4444', createdAt: new Date(Date.now() - 86400000 * 70) },
      { name: 'Ethan Hunt', email: 'ethan@example.com', contactInfo: '555-555-6666', createdAt: new Date(Date.now() - 86400000 * 60) },
      { name: 'Fiona Glenanne', email: 'fiona@example.com', contactInfo: '555-777-8888', createdAt: new Date(Date.now() - 86400000 * 50) },
  ];
  
  const today = new Date();

  for (const customerData of customers) {
      let currentBalance = 0;
      const customerDocRef = db.collection('customers').doc();
      
      // Create viewer user accounts
      let viewerUid: string | undefined = undefined;
      if (customerData.email) {
          try {
              const userRecord = await auth.createUser({
                  email: customerData.email,
                  password: 'password', // Standard password for all viewers
                  displayName: customerData.name,
              });
              await auth.setCustomUserClaims(userRecord.uid, { role: 'viewer' });
              viewerUid = userRecord.uid;

              // Create user document for viewer
              const userDocRef = db.collection('users').doc(viewerUid);
              batch.set(userDocRef, {
                  name: customerData.name,
                  email: customerData.email,
                  role: 'viewer',
                  customerId: customerDocRef.id,
              });

          } catch (error: any) {
              if (error.code === 'auth/email-already-exists') {
                  const existingUser = await auth.getUserByEmail(customerData.email);
                  viewerUid = existingUser.uid;
                  // Ensure claims and user doc are set correctly even if user exists
                  await auth.setCustomUserClaims(viewerUid, { role: 'viewer' });
                  const userDocRef = db.collection('users').doc(viewerUid);
                  batch.set(userDocRef, {
                    name: customerData.name,
                    email: customerData.email,
                    role: 'viewer',
                    customerId: customerDocRef.id,
                  }, { merge: true });
              } else {
                  console.error(`Error creating viewer user ${customerData.email}:`, error);
              }
          }
      }

      // Generate historical data
      for (let monthIndex = 3; monthIndex >= 0; monthIndex--) {
          const date = subMonths(today, monthIndex);
          const start = startOfMonth(date);
          const end = endOfMonth(date);
          const daysInMonth = eachDayOfInterval({ start, end });
          const usageCountThisMonth = 5 + Math.floor(Math.random() * 5);
          
          for (let i = 0; i < usageCountThisMonth; i++) {
              const usageDay = daysInMonth[Math.floor(Math.random() * daysInMonth.length)];
              const startHour = 8 + Math.floor(Math.random() * 10);
              const durationHours = 1 + Math.random() * 3;
              const cost = durationHours * CORE_WATER_RATE_PER_HOUR;
              const startTime = new Date(usageDay);
              startTime.setHours(startHour, Math.floor(Math.random() * 60));
              const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

              const usageRecord: Omit<WaterUsageRecord, 'id' | 'customerName'> = {
                  customerId: customerDocRef.id,
                  date: Timestamp.fromDate(usageDay),
                  startTime: Timestamp.fromDate(startTime),
                  endTime: Timestamp.fromDate(endTime),
                  durationHours,
                  cost,
                  recordedBy: adminUserRecord.uid,
                  createdAt: Timestamp.now(),
              };
              const usageDocRef = db.collection('customers').doc(customerDocRef.id).collection('usageRecords').doc();
              batch.set(usageDocRef, usageRecord);
              currentBalance += cost;
          }

          const paymentCount = Math.random() > 0.3 ? 2 : 1;
          for (let i = 0; i < paymentCount; i++) {
              const paymentDay = daysInMonth[10 + Math.floor(Math.random() * 15)];
              const paymentDate = new Date(paymentDay);
              paymentDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
              const paymentAmount = (currentBalance / paymentCount) * (0.8 + Math.random() * 0.3);
              
              if (paymentAmount > 100) {
                  const paymentRecord: Omit<Payment, 'id' | 'customerName'> = {
                      customerId: customerDocRef.id,
                      paymentDate: Timestamp.fromDate(paymentDate),
                      amountPaid: paymentAmount,
                      recordedBy: adminUserRecord.uid,
                      createdAt: Timestamp.now(),
                  };
                  const paymentDocRef = db.collection('customers').doc(customerDocRef.id).collection('payments').doc();
                  batch.set(paymentDocRef, paymentRecord);
                  currentBalance -= paymentAmount;
              }
          }
      }
      
      const finalCustomerData: Customer = {
          id: customerDocRef.id,
          name: customerData.name,
          email: customerData.email,
          contactInfo: customerData.contactInfo,
          authUID: viewerUid,
          createdAt: Timestamp.fromDate(customerData.createdAt),
          balance: Math.round(currentBalance),
      };
      batch.set(customerDocRef, finalCustomerData);
  }
  
  await batch.commit();
  console.log('Database seeding complete.');
}
