'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as XLSX from 'xlsx';

// Interface matching the comprehensive Excel structure
interface ImportRow {
    // Basic
    nombre?: string;
    name?: string;
    id_negocio?: string;
    businessCode?: string;
    
    // Categories
    categoria?: string;
    category?: string;
    subcategoria?: string;
    subcategory?: string;

    // Descriptions
    descripcion?: string;
    description?: string;
    descripcion_es?: string;
    description_es?: string;
    descripcion_en?: string;
    description_en?: string;
    descripcion_de?: string;
    description_de?: string;

    // Location
    direccion?: string;
    address?: string;
    zip?: string;
    plz?: string;
    ciudad?: string;
    city?: string;
    stadt?: string;
    barrio?: string;
    neighborhood?: string;
    stadtteil?: string;
    pais?: string;
    country?: string;
    land?: string;

    // Contact & Web
    telefono?: string;
    phone?: string;
    email?: string;
    web?: string;
    website?: string;
    sitio_web?: string;
    oferta_url?: string;
    currentOfferUrl?: string;
    mapa_url?: string;
    mapUrl?: string;

    // Media & AI
    logo_url?: string;
    imageUrl?: string;
    pista_imagen?: string;
    imageHint?: string;

    // Status & Metrics
    rating?: number | string;
    calificacion?: number | string;
    lat?: number | string;
    latitude?: number | string;
    lng?: number | string;
    longitude?: number | string;
    tipo?: string;
    tier_level?: string;
    activo?: boolean | string;
    active?: boolean | string;

    [key: string]: any;
}

const DEFAULT_CATEGORY = 'Prospecto Importado';
const DEFAULT_LOGO = 'https://dicilo.net/img/default_logo.png';

export async function importBusinessesFromExcel(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, message: 'No file uploaded' };
    }

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: ImportRow[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
            return { success: false, message: 'File is empty' };
        }

        const db = getAdminDb();
        const batch = db.batch();
        const businessesRef = db.collection('businesses');

        // 1. Pre-fetch Categories for matching
        const categoriesSnapshot = await db.collection('categories').get();
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        let importedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        for (const row of rows) {
            // --- FIELD NORMALIZATION ---
            const name = (row.nombre || row.name || '').toString().trim();
            if (!name) {
                skippedCount++;
                continue;
            }

            // Check Duplicate by Name
            const existingQuery = await businessesRef.where('name', '==', name).limit(1).get();
            if (!existingQuery.empty) {
                skippedCount++;
                continue;
            }

            // Internal ID
            const businessCode = (row.id_negocio || row.businessCode || '').toString().trim();

            // Descriptions & Translations
            const descES = (row.descripcion_es || row.description_es || row.descripcion || row.description || '').toString().trim();
            const descEN = (row.descripcion_en || row.description_en || '').toString().trim();
            const descDE = (row.descripcion_de || row.description_de || '').toString().trim();
            
            const description_translations = {
                es: descES,
                en: descEN,
                de: descDE
            };

            // Address Components
            const address = (row.direccion || row.address || '').toString().trim();
            const zip = (row.zip || row.plz || '').toString().trim();
            const city = (row.ciudad || row.city || row.stadt || '').toString().trim();
            const neighborhood = (row.barrio || row.neighborhood || row.stadtteil || '').toString().trim();
            const country = (row.pais || row.country || row.land || 'Deutschland').toString().trim();

            const locationStr = [city, country].filter(Boolean).join(', ') || address || 'Unknown Location';

            // Contact
            const phone = (row.telefono || row.phone || '').toString().trim();
            const website = (row.web || row.website || row.sitio_web || '').toString().trim();
            const email = (row.email || '').toString().trim();
            const currentOfferUrl = (row.oferta_url || row.currentOfferUrl || '').toString().trim();
            const mapUrl = (row.mapa_url || row.mapUrl || '').toString().trim();

            // Media
            const imageUrl = (row.logo_url || row.imageUrl || DEFAULT_LOGO).toString().trim();
            const imageHint = (row.pista_imagen || row.imageHint || `business storefront of ${name}`).toString().trim();

            // Status & Metrics
            const rawRating = row.rating || row.calificacion || 0;
            const rating = typeof rawRating === 'number' ? rawRating : parseFloat(rawRating.toString()) || 0;

            const rawActive = row.activo !== undefined ? row.activo : row.active;
            let active = false;
            if (rawActive === true || rawActive === 'true' || String(rawActive) === '1') active = true;

            const tier_level = (row.tipo || row.tier_level || 'basic').toString().toLowerCase().trim() === 'premium' ? 'premium' : 'basic';

            // Coordinates
            const lat = parseFloat((row.lat || row.latitude || '0').toString());
            const lng = parseFloat((row.lng || row.longitude || '0').toString());
            const coords = (lat !== 0 || lng !== 0) ? [lat, lng] : null;

            // --- CATEGORY MATCHING ---
            const categoryFromRow = (row.categoria || row.category || '').toString().trim();
            const subcategoryFromRow = (row.subcategoria || row.subcategory || '').toString().trim();

            let category_key = '';
            let subcategory_key = '';
            let finalCategoryName = categoryFromRow || DEFAULT_CATEGORY;

            if (categoryFromRow) {
                const matchedCat = categoriesData.find(c => 
                    c.name.de?.toLowerCase() === categoryFromRow.toLowerCase() ||
                    c.name.es?.toLowerCase() === categoryFromRow.toLowerCase() ||
                    c.name.en?.toLowerCase() === categoryFromRow.toLowerCase() ||
                    c.id.toLowerCase() === categoryFromRow.toLowerCase()
                );

                if (matchedCat) {
                    category_key = `category.${matchedCat.id}`;
                    // Use the DE name as the string representation for 'category' field if possible
                    finalCategoryName = matchedCat.name.de || categoryFromRow;

                    if (subcategoryFromRow && matchedCat.subcategories) {
                        const matchedSub = matchedCat.subcategories.find((s: any) => 
                            s.name.de?.toLowerCase() === subcategoryFromRow.toLowerCase() ||
                            s.name.es?.toLowerCase() === subcategoryFromRow.toLowerCase() ||
                            s.name.en?.toLowerCase() === subcategoryFromRow.toLowerCase() ||
                            s.id.toLowerCase() === subcategoryFromRow.toLowerCase()
                        );
                        if (matchedSub) {
                            subcategory_key = `subcategory.${matchedSub.id}`;
                            finalCategoryName += ` / ${matchedSub.name.de || subcategoryFromRow}`;
                        }
                    }
                }
            }

            // --- DOCUMENT PREPARATION ---
            const docRef = businessesRef.doc();
            const businessData: any = {
                name,
                businessCode,
                description: descES, // Primary description is ES for matching UI logic
                description_translations,
                address,
                zip,
                city,
                neighborhood,
                country,
                location: locationStr,
                phone,
                website,
                email,
                currentOfferUrl,
                mapUrl,
                imageUrl,
                imageHint,
                rating,
                active,
                tier_level,
                category: finalCategoryName,
                category_key,
                subcategory_key,
                source: 'excel_import_advanced',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };

            if (coords) businessData.coords = coords;

            // Remove empty fields to keep DB clean
            Object.keys(businessData).forEach(key => {
                if (businessData[key] === undefined || businessData[key] === '') {
                    delete businessData[key];
                }
            });

            batch.set(docRef, businessData);
            importedCount++;

            // Safety limit check (Firestore standard batch limit is 500)
            if (importedCount >= 450) {
                errors.push("Limit of 450 items reached in one batch for safety. Please upload remaining data separately.");
                break;
            }
        }

        if (importedCount > 0) {
            await batch.commit();
        }

        return {
            success: true,
            imported: importedCount,
            skipped: skippedCount,
            message: `Successfully imported ${importedCount} businesses. Skipped ${skippedCount} duplicates or invalid rows.`,
            errors: errors.length > 0 ? errors : undefined
        };

    } catch (error: any) {
        console.error('Import error:', error);
        return { success: false, message: error.message };
    }
}
