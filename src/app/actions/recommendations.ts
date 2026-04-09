'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { registerNewProspect } from './dicipoints';
import { sendBusinessRecommendationEmail } from '@/lib/email';
import { sendProspectInvitation } from './prospect-actions';
import { sendSmtpEmail } from '@/lib/mail-service';
import sharp from 'sharp';
import { randomUUID, randomBytes } from 'crypto';

import { checkBusinessDuplicate } from './business-utils';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const recommendSchema = z.object({
    companyName: z.string().min(2, "Nombre de empresa muy corto").max(150, "Nombre muy largo"),
    neighborhood: z.string().max(150).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    email: z.string().max(150).optional().nullable(),
    contactName: z.string().max(150).optional().nullable(),
    comments: z.string().max(2000, "Los comentarios no pueden exceder 2000 caracteres").optional().nullable()
});

export async function submitRecommendation(formData: FormData) {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    // Limits an IP to 5 recommendations per minute
    if (!checkRateLimit(`create_rec_${ip}`, 5, 60000)) {
        return { success: false, error: 'Has excedido el límite de recomendaciones. Por favor, espera 1 minuto.' };
    }

    try {
        const db = getAdminDb();
        const storage = getAdminStorage();
        const bucket = storage.bucket();

        // Extract textual data
        const rawData = {
            companyName: formData.get('companyName') as string,
            neighborhood: formData.get('neighborhood') as string,
            city: formData.get('city') as string,
            phone: formData.get('phone') as string,
            email: formData.get('email') as string,
            contactName: (formData.get('contactFirstName') as string || '') + ' ' + (formData.get('contactLastName') as string || ''),
            comments: formData.get('comments') as string
        };

        const parsed = recommendSchema.safeParse(rawData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.errors[0].message };
        }

        const { companyName, neighborhood, city, phone, email, contactName, comments } = parsed.data;

        // Check for duplicates (Company Name + Address + Phone)
        const address = neighborhood || city;
        const dupCheck = await checkBusinessDuplicate(companyName, address || '', phone || '');
        if (dupCheck.isDuplicate) {
            return { 
                success: false, 
                error: "Esta empresa ya está registrada o recomendada con el mismo nombre, ubicación y teléfono." 
            };
        }

        const companyEmail = formData.get('companyEmail') as string;
        const companyPhone = formData.get('companyPhone') as string;
        const country = formData.get('country') as string;
        const countryCode = formData.get('countryCode') as string;
        const website = formData.get('website') as string;
        const category = formData.get('category') as string;
        const diciloCode = formData.get('diciloCode') as string;
        const source = formData.get('source') as string;
        const userId = formData.get('userId') as string;
        const campaignId = formData.get('campaignId') as string; // New field
        const lang = (formData.get('lang') as any) || 'es'; // Language for the email

        const mediaFiles = formData.getAll('media') as File[];
        
        const uploadPromises = mediaFiles.map(async (file) => {
            if (file.size === 0) return null;

            try {
                const buffer = Buffer.from(await file.arrayBuffer() as any);
                const fileName = `${randomUUID()}`;
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');

                let uploadBuffer = buffer;
                let finalPath = '';
                let contentType = file.type;

                if (isImage) {
                    if (file.type === 'image/webp') {
                        finalPath = `recommendations/images/${fileName}.webp`;
                        contentType = 'image/webp';
                    } else {
                        try {
                            uploadBuffer = await sharp(buffer)
                                .webp({ quality: 80 })
                                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                                .toBuffer();
                            finalPath = `recommendations/images/${fileName}.webp`;
                            contentType = 'image/webp';
                        } catch (err) {
                            console.error("Sharp processing failed, uploading original:", err);
                            const ext = file.name.split('.').pop() || 'jpg';
                            finalPath = `recommendations/images/${fileName}.${ext}`;
                        }
                    }
                } else if (isVideo) {
                    const ext = file.name.split('.').pop() || 'mp4';
                    finalPath = `recommendations/videos/${fileName}.${ext}`;
                } else {
                    return null; // Skip unknown types
                }

                const fileRef = bucket.file(finalPath);
                await fileRef.save(uploadBuffer, {
                    metadata: { contentType },
                });

                await fileRef.makePublic();
                return {
                    type: (isImage ? 'image' : 'video') as 'image' | 'video',
                    url: fileRef.publicUrl()
                };
            } catch (err) {
                console.error("Single file upload error in recommendation:", err);
                return null;
            }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const media = uploadResults.filter((item): item is { type: 'image' | 'video'; url: string } => item !== null);

        let finalReferrerName = formData.get('referrerName') as string || '';
        const finalReferrerEmail = formData.get('referrerEmail') as string || '';

        let finalDiciloCode = diciloCode || '';

        if (userId) {
            try {
                const userDoc = await db.collection('private_profiles').doc(userId).get();
                if (userDoc.exists) {
                    const ud = userDoc.data() || {};
                    finalReferrerName = ud.name || ud.firstName || ud.first_name || finalReferrerName;
                    finalDiciloCode = ud.uniqueCode || ud.diciloCode || finalDiciloCode;
                }
            } catch (e) {
                console.error("Error fetching referer details", e);
            }
        }
        
        if (!finalReferrerName) {
            finalReferrerName = String(contactName || 'Un usuario de Dicilo');
        }

        const securityKey = randomBytes(4).toString('hex').toUpperCase();

        const recommendationData: any = {
            companyName,
            contactFirstName: formData.get('contactFirstName') as string || '',
            contactLastName: formData.get('contactLastName') as string || '',
            contactName: contactName || '',
            email,
            phone,
            companyEmail: companyEmail || null,
            companyPhone: companyPhone || null,
            country,
            countryCode,
            city,
            website,
            category,
            comments,
            diciloCode: finalDiciloCode,
            source: source || 'search_page_recommendation',
            neighborhood,
            userId,
            media,
            photoUrl: media.find(m => m.type === 'image')?.url || '',
            status: 'approved', // Auto-approved for this flow
            validationStatus: 'pending',
            securityKey,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            pointsPaid: false,
            campaignId: campaignId || null, // Shared Campaign ID logic
            referrerName: finalReferrerName,
            referrerEmail: finalReferrerEmail
        };

        const ref = await db.collection('recommendations').add(recommendationData);
        console.log(`[Recommendation] Saved with ID: ${ref.id}`);

        // --- POST-SAVE BACKGROUND-ISH TASKS ---
        // We wrap these in a separate try/catch to ensure the main action returns success 
        // even if one of these secondary steps fails.
        
        try {
            let rewardAmount = parseInt(formData.get('rewardAmount') as string || '10');
            if (isNaN(rewardAmount)) rewardAmount = 10;

            try {
                const { getTemplate } = await import('@/actions/email-templates');
                const template = await getTemplate('qVCINezvMyoMLJk7DUnL');
                if (template) {
                    rewardAmount = template.rewardSender || template.rewardAmount || rewardAmount;
                }
            } catch (e) {
                console.error("[Post-Save] Error fetching template reward:", e);
            }

            // A. REWARD POINTS
            // (Removed to avoid double padding. Points are now given purely by sendProspectInvitation: +20 DP)

            // B. BUSINESS NOTIFICATION EMAIL
            console.log(`[Post-Save] Sending automated invitation to: ${email}`);
            const invitationResult = await sendProspectInvitation(ref.id);
            if (!invitationResult.success) {
                console.warn("[Post-Save] Invitation email might have failed:", invitationResult.error);
            }

            // C. REFERRER THANK YOU EMAIL
            if (!userId && finalReferrerEmail) {
                console.log(`[Post-Save] Sending thank you email to referrer: ${finalReferrerEmail}`);
                const subject = lang === 'de' ? 'Danke für deine Empfehlung!' : (lang === 'en' ? 'Thank you for your recommendation!' : '¡Gracias por tu recomendación!');
                const body = lang === 'de' ? 
                    `Hallo ${finalReferrerName},<br/><br/>Danke, dass du das Unternehmen <b>${companyName}</b> empfohlen hast.<br/>Jede Empfehlung hilft uns, Dicilo zu verbessern!<br/><br/>Dein Dicilo Team` :
                    (lang === 'en' ? 
                    `Hi ${finalReferrerName},<br/><br/>Thank you for recommending <b>${companyName}</b>.<br/>Every recommendation helps us improve Dicilo!<br/><br/>Your Dicilo Team` :
                    `Hola ${finalReferrerName},<br/><br/>Gracias por recomendar la empresa <b>${companyName}</b>.<br/>¡Tu aporte ayuda a hacer crecer la comunidad Dicilo!<br/><br/>El Equipo Dicilo`);
                
                await sendSmtpEmail({
                    to: finalReferrerEmail,
                    subject,
                    html: body
                }).catch(e => console.error("[Post-Save] Error sending referrer thank you:", e));
            }

            // D. AUTO-TRANSFER TO BASIC
            const fieldsToCheck = [
                companyName, email, country, city, category, phone, website, neighborhood, comments, 
                (media && media.length > 0) ? "hasMedia" : ""
            ];
            const filledCount = fieldsToCheck.filter(f => f && typeof f === 'string' && f.trim().length > 0).length;
            const completePercentage = (filledCount / fieldsToCheck.length) * 100;

            if (completePercentage >= 75) {
                console.log(`[Post-Save] Data completeness is ${completePercentage.toFixed(0)}%, auto-transferring to basic businesses.`);
                let activeCategory = category || 'other';
                if (String(activeCategory).toLowerCase() === 'gastronomy') activeCategory = 'gastronomy';
                
                const locationString = neighborhood ? `${neighborhood}, ${city}, ${country}` : `${city}, ${country}`;
                const businessData = {
                    name: companyName || 'Empresa Recomendada',
                    email: email || '',
                    phone: phone || '',
                    category: activeCategory,
                    city: city || '',
                    country: country || '',
                    location: locationString || '',
                    website: website || '',
                    active: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    sourceRecommendationId: ref.id,
                    photos: media.filter(m => m.type === 'image').map(m => m.url),
                    videos: media.filter(m => m.type === 'video').map(m => m.url),
                    description: comments || ''
                };
                
                await db.collection('businesses').add(businessData).catch(e => 
                    console.error("[Post-Save] Error creating basic business:", e)
                );
                await ref.update({ autoTransferredToBasic: true }).catch(e => 
                    console.error("[Post-Save] Error updating recommendation status:", e)
                );
            }

        } catch (postSaveError) {
            // We catch ALL post-save errors to ensure they don't block the UI success
            console.error("[Post-Save] Critical error in secondary tasks:", postSaveError);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Critical error in submitRecommendation:", error);
        return { success: false, error: "Detalle de servidor: " + (error?.message || String(error)) };
    }
}
