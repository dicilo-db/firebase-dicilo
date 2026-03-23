'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { registerNewProspect } from './dicipoints';
import { sendBusinessRecommendationEmail } from '@/lib/email';
import { sendProspectInvitation } from './prospect-actions';
import { sendSmtpEmail } from '@/lib/mail-service';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

import { checkBusinessDuplicate } from './business-utils';

export async function submitRecommendation(formData: FormData) {
    try {
        const db = getAdminDb();
        const storage = getAdminStorage();
        const bucket = storage.bucket();

        // Extract textual data
        const companyName = formData.get('companyName') as string;
        const neighborhood = formData.get('neighborhood') as string;
        const city = formData.get('city') as string;
        const phone = formData.get('phone') as string;

        // Check for duplicates (Company Name + Address + Phone)
        // We use neighborhood or city as the address factor for recommendations
        const address = neighborhood || city;
        const dupCheck = await checkBusinessDuplicate(companyName, address, phone);
        if (dupCheck.isDuplicate) {
            return { 
                success: false, 
                error: "Esta empresa ya está registrada o recomendada con el mismo nombre, ubicación y teléfono." 
            };
        }

        const contactFirstName = formData.get('contactFirstName') as string;
        const contactLastName = formData.get('contactLastName') as string;
        const contactName = `${contactFirstName || ''} ${contactLastName || ''}`.trim() || (formData.get('contactName') as string);
        const email = formData.get('email') as string;
        const companyEmail = formData.get('companyEmail') as string;
        const companyPhone = formData.get('companyPhone') as string;
        const country = formData.get('country') as string;
        const countryCode = formData.get('countryCode') as string;
        const website = formData.get('website') as string;
        const category = formData.get('category') as string;
        const comments = formData.get('comments') as string;
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

        const securityKey = randomBytes(4).toString('hex').toUpperCase();

        const recommendationData: any = {
            companyName,
            contactFirstName,
            contactLastName,
            contactName,
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
            diciloCode,
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
            referrerName: formData.get('referrerName') || 'Un usuario de Dicilo'
        };

        const ref = await db.collection('recommendations').add(recommendationData);
        let rewardAmount = parseInt(formData.get('rewardAmount') as string || '10');
        try {
            const { getTemplate } = await import('@/actions/email-templates');
            const template = await getTemplate('qVCINezvMyoMLJk7DUnL');
            if (template) {
                rewardAmount = template.rewardSender || template.rewardAmount || rewardAmount;
            }
        } catch (e) {
            console.error("Error fetching template reward:", e);
        }

        // AUTOMATIC PAYMENT
        if (userId) {
            await registerNewProspect(userId, ref.id, rewardAmount);
        }

        // BUSINESS NOTIFICATION EMAIL (Requirement 1)
        console.log(`Sending automated invitation to: ${email} for company: ${companyName}`);
        await sendProspectInvitation(ref.id);

        // NON-REGISTERED RECOMMENDER THANK YOU EMAIL (Requirement 2)
        const referrerName = (formData.get('referrerName') as string) || (contactName) || 'Un usuario de Dicilo';
        const referrerEmail = formData.get('referrerEmail') as string;

        if (!userId && referrerEmail) {
            const subject = lang === 'de' ? 'Danke für deine Empfehlung!' : (lang === 'en' ? 'Thank you for your recommendation!' : '¡Gracias por tu recomendación!');
            const body = lang === 'de' ? 
                `Hallo ${referrerName},<br/><br/>Danke, dass du das Unternehmen <b>${companyName}</b> empfohlen hast.<br/>Jede Empfehlung hilft uns, Dicilo zu verbessern!<br/><br/>Dein Dicilo Team` :
                (lang === 'en' ? 
                `Hi ${referrerName},<br/><br/>Thank you for recommending <b>${companyName}</b>.<br/>Every recommendation helps us improve Dicilo!<br/><br/>Your Dicilo Team` :
                `Hola ${referrerName},<br/><br/>Gracias por recomendar la empresa <b>${companyName}</b>.<br/>¡Tu aporte ayuda a hacer crecer la comunidad Dicilo!<br/><br/>El Equipo Dicilo`);
            
            await sendSmtpEmail({
                to: referrerEmail,
                subject,
                html: body
            });
        }

        // AUTO-TRANSFER TO BASIC (Requirement 3)
        const fieldsToCheck = [
            companyName, email, country, city, category, phone, website, neighborhood, comments, 
            (media && media.length > 0) ? "hasMedia" : ""
        ];
        const filledCount = fieldsToCheck.filter(f => f && typeof f === 'string' && f.trim().length > 0).length;
        const completePercentage = (filledCount / fieldsToCheck.length) * 100;

        if (completePercentage >= 75) {
            let activeCategory = category;
            if (activeCategory === 'Gastronomy') activeCategory = 'gastronomy'; // sanity check
            
            const locationString = neighborhood ? `${neighborhood}, ${city}, ${country}` : `${city}, ${country}`;
            const businessData = {
                name: companyName,
                email: email,
                phone: phone || '',
                category: activeCategory,
                city: city,
                country: country,
                location: locationString,
                website: website || '',
                active: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                sourceRecommendationId: ref.id,
                photos: media.filter(m => m.type === 'image').map(m => m.url),
                videos: media.filter(m => m.type === 'video').map(m => m.url),
                description: comments || ''
            };
            await db.collection('businesses').add(businessData);
            await ref.update({ autoTransferredToBasic: true });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error submitting recommendation:', error);
        return { success: false, error: error.message };
    }
}
