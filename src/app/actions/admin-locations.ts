'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

const COLLECTION_NAME = 'system_locations';

export interface City {
    name: string;
    districts: string[];
}

export interface LocationData {
    id: string;
    countryCode: string;
    countryName: string;
    cities: City[]; // Updated from string[] to City[]
    isActive: boolean;
}

export async function getLocations(): Promise<{ success: boolean; data?: LocationData[]; error?: string }> {
    try {
        const db = getAdminDb();
        const snapshot = await db.collection(COLLECTION_NAME).get();

        const locations = snapshot.docs.map(doc => {
            const data = doc.data();
            // Migration logic: if cities is string[], convert to City[]
            let cities: City[] = [];
            if (Array.isArray(data.cities)) {
                cities = data.cities.map((c: any) => {
                    if (typeof c === 'string') {
                        return { name: c, districts: [] };
                    }
                    // Sanitize city object to ensure only expected fields are returned
                    return {
                        name: c.name || '',
                        districts: Array.isArray(c.districts) ? c.districts : []
                    };
                });
            }

            // Explicitly map fields to avoid serialization errors with Timestamps or other non-serializable objects
            return {
                id: doc.id,
                countryCode: data.countryCode || '',
                countryName: data.countryName || '',
                isActive: data.isActive ?? true,
                cities
            };
        }) as LocationData[];

        // Sort by country name
        locations.sort((a, b) => a.countryName.localeCompare(b.countryName));

        return { success: true, data: locations };
    } catch (error: any) {
        console.error('Error fetching locations:', error);
        return { success: false, error: error.message };
    }
}

export async function addCountry(data: { countryName: string; countryCode: string }): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();

        const existing = await db.collection(COLLECTION_NAME)
            .where('countryName', '==', data.countryName)
            .get();

        if (!existing.empty) {
            return { success: false, error: 'El país ya existe.' };
        }

        await db.collection(COLLECTION_NAME).add({
            countryName: data.countryName,
            countryCode: data.countryCode.toUpperCase(),
            cities: [],
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateCountry(id: string, data: Partial<LocationData>): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        await db.collection(COLLECTION_NAME).doc(id).update(data);
        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteCountry(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        await db.collection(COLLECTION_NAME).doc(id).delete();
        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Add a city (initialized with empty districts)
export async function addCity(countryId: string, cityName: string): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        // Since we are storing objects, arrayUnion only works if the object is identical.
        // But manual check is better to avoid dupes by name.
        const docRef = db.collection(COLLECTION_NAME).doc(countryId);
        const doc = await docRef.get();
        if (!doc.exists) return { success: false, error: 'País no encontrado' };

        const currentData = doc.data();
        const cities = (currentData?.cities || []) as any[];

        // Check if city exists (by name, case insensitive maybe? keeping it simple for now)
        if (cities.some(c => (typeof c === 'string' ? c : c.name) === cityName)) {
            return { success: false, error: 'La ciudad ya existe.' };
        }

        const newCity: City = { name: cityName, districts: [] };

        await docRef.update({
            cities: admin.firestore.FieldValue.arrayUnion(newCity)
        });

        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Remove a city object
export async function removeCity(countryId: string, cityName: string): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        const docRef = db.collection(COLLECTION_NAME).doc(countryId);

        // We need to read, filter, and update because arrayRemove needs the EXACT object
        const doc = await docRef.get();
        if (!doc.exists) return { success: false, error: 'País no encontrado' };

        let cities = (doc.data()?.cities || []) as any[];

        const initialLength = cities.length;
        cities = cities.filter(c => {
            const name = typeof c === 'string' ? c : c.name;
            return name !== cityName;
        });

        if (cities.length === initialLength) {
            return { success: false, error: 'Ciudad no encontrada.' };
        }

        await docRef.update({ cities });
        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Add a district to a city
export async function addDistrict(countryId: string, cityName: string, districtName: string): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        const docRef = db.collection(COLLECTION_NAME).doc(countryId);
        const doc = await docRef.get();
        if (!doc.exists) return { success: false, error: 'País no encontrado' };

        let cities = (doc.data()?.cities || []) as any[];

        // Normalize for update
        const cityIndex = cities.findIndex(c => (typeof c === 'string' ? c : c.name) === cityName);

        if (cityIndex === -1) return { success: false, error: 'Ciudad no encontrada' };

        let targetCity = cities[cityIndex];

        // Handle migration if string
        if (typeof targetCity === 'string') {
            targetCity = { name: targetCity, districts: [] };
        }

        if (targetCity.districts.includes(districtName)) {
            return { success: false, error: 'El barrio ya existe.' };
        }

        targetCity.districts.push(districtName);
        cities[cityIndex] = targetCity;

        await docRef.update({ cities });
        revalidatePath('/admin/locations');
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Remove a district from a city
export async function removeDistrict(countryId: string, cityName: string, districtName: string): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        const docRef = db.collection(COLLECTION_NAME).doc(countryId);
        const doc = await docRef.get();
        if (!doc.exists) return { success: false, error: 'País no encontrado' };

        let cities = (doc.data()?.cities || []) as any[];

        const cityIndex = cities.findIndex(c => (typeof c === 'string' ? c : c.name) === cityName);

        if (cityIndex === -1) return { success: false, error: 'Ciudad no encontrada' };

        let targetCity = cities[cityIndex];

        // Handle migration if string (unlikely if removing district, but safe)
        if (typeof targetCity === 'string') {
            return { success: false, error: 'Barrio no encontrado (es una ciudad antigua).' };
        }

        targetCity.districts = targetCity.districts.filter(d => d !== districtName);
        cities[cityIndex] = targetCity;

        await docRef.update({ cities });
        revalidatePath('/admin/locations');
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
