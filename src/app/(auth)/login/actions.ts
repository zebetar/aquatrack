
'use server';

import { seedDatabase } from '@/lib/firebase-service';

export async function seedDatabaseAction() {
    await seedDatabase();
}
