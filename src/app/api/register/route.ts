import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { createPrivateUserProfile } from '@/lib/private-user-service';
import { sendWelcomeEmail } from '@/lib/email';
import * as admin from 'firebase-admin';
import { resolveRewards } from '@/lib/rewards';
import { checkAndUpgradeRank } from '@/app/actions/mlm-actions';

// ¡REEMPLAZAR CON TU URL REAL DE N8N!
const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'https://webhook.site/d2a33f4a-7360-4f95-9273-d5d1c2580a37';

// Define the schema for validation (must match frontend)
const registrationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  whatsapp: z.string().optional(),
  contactType: z.enum(['whatsapp', 'telegram']).optional(),
  registrationType: z.enum(['private', 'donor', 'retailer', 'premium']),
  // Business Fields
  businessName: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageHint: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  currentOfferUrl: z.string().url().optional().or(z.literal('')),
  mapUrl: z.string().url().optional().or(z.literal('')),
  coords: z.array(z.number()).length(2).optional(),
  referralCode: z.string().optional(), // Added referralCode
  inviteId: z.string().optional(), // Added inviteId
  lang: z.string().optional(),
});

// Helper function to create a URL-friendly slug
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// --- HELPER FUNCTIONS FOR LOGIC ---

/**
 * GENERATE REFONL CODE (Sequence)
 * Logic: Get current sequence from counters/refonl -> Increment -> Return formatted code.
 * Example: REFONL#0041
 */
async function getNextRefonlCode(db: admin.firestore.Firestore): Promise<string> {
  const counterRef = db.collection('counters').doc('refonl');

  try {
    return await db.runTransaction(async (t) => {
      const doc = await t.get(counterRef);
      let currentCount = 0;
      if (doc.exists) {
        currentCount = doc.data()?.count || 40; // Default start based on request "REFONL#0040"
      }
      const nextCount = currentCount + 1;
      t.set(counterRef, { count: nextCount }, { merge: true });
      return `REFONL#${nextCount.toString().padStart(4, '0')}`;
    });
  } catch (error) {
    console.error("Error generating REFONL:", error);
    return 'REFONL#0000'; // Fallback
  }
}

/**
 * GENERATE USER UNIQUE CODE
 * Logic: If COMPANY (retailer/premium/donor) -> EMDC-{random/seq}. Else Standard.
 */
function generateUserCode(role: string, uid: string): string {
  const isCompany = ['retailer', 'premium', 'donor'].includes(role);
  if (isCompany) {
    // Simple EMDC generation based on UID substring for consistency and speed
    // Or could use a random string.
    return `EMDC-${uid.substring(0, 5).toUpperCase()}${Math.floor(Math.random() * 100)}`;
  } else {
    // For standard users, usually handled by private-user-service, but as fallback:
    return `USR-${uid.substring(0, 6).toUpperCase()}`;
  }
}

/**
 * RESOLVE REFERRER
 * Logic: Check if code provided exists. If yes -> Return data. If no -> Return REFONL.
 */
async function resolveReferrer(db: admin.firestore.Firestore, code: string | undefined | null) {
  if (code && code.trim().length > 0) {
    // CASE A: Code Provided
    // Check in private_profiles (where uniqueCode usually lives)
    const query = await db.collection('private_profiles').where('uniqueCode', '==', code).limit(1).get();
    if (!query.empty) {
      const refDoc = query.docs[0];
      const data = refDoc.data();
      return {
        id: refDoc.id, // UID
        code: data.uniqueCode,
        role: data.role || 'user', // Assuming role is in profile
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        isValid: true,
        isRefonl: false
      };
    }
    // Also check 'registrations' if companies refer companies?
    // For now, assuming standard referrers are in private_profiles.
  }

  // CASE B: Empty or Invalid -> Assign REFONL
  const refonlCode = await getNextRefonlCode(db);
  return {
    id: 'SYSTEM_REFONL',
    code: refonlCode,
    role: 'system',
    name: 'Dicilo Team',
    isValid: true,
    isRefonl: true
  };
}


import { checkBusinessDuplicate } from '@/app/actions/business-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json(); // Read body once

    const result = registrationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      firstName, lastName, email, password, country, city, whatsapp, contactType, registrationType,
      businessName, category, description, location, address, phone, website,
      imageUrl, imageHint, rating, currentOfferUrl, mapUrl, coords, referralCode, inviteId, lang
    } = result.data;

    const db = getAdminDb();
    const auth = getAdminAuth();

    // --- DUPLICATE BUSINESS CHECK ---
    const isCompany = ['retailer', 'premium', 'donor'].includes(registrationType);
    if (isCompany && businessName) {
        // According to user: Check Name, Address, Phone.
        // Use 'address' or 'location' as address factor.
        const businessAddress = address || location;
        const dupCheck = await checkBusinessDuplicate(businessName, businessAddress, phone);
        
        if (dupCheck.isDuplicate) {
            return NextResponse.json(
                { message: 'Esta empresa ya está registrada con el mismo nombre, dirección y teléfono. Si es una filial, por favor ajusta la dirección.' },
                { status: 409 }
            );
        }
    }
    // ---------------------------------

    // 1. Create Authentication User
    let ownerUid = null;
    if (password) {
      try {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: `${firstName} ${lastName}`,
        });
        ownerUid = userRecord.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-exists') {
          return NextResponse.json({ message: 'Email already registered.' }, { status: 409 });
        }
        // Log but maybe don't fail completely if we want idempotency? No, standard register fails.
        return NextResponse.json({ message: `Auth Error: ${authError.message}` }, { status: 500 });
      }
    } else {
      // Should we allow registration without password? Schema says optional logic?
      // The original code allowed null ownerUid. We keep it.
    }

    // 2. Logic: ID & Referrer

    // A. Generate Unique User Code (EMDC for companies)
    const userCode = generateUserCode(registrationType, ownerUid || 'TEMP' + Math.random());

    // B. Resolve Referrer
    const referrerData = await resolveReferrer(db, referralCode);

    // 3. Save to Firestore (Registrations)
    const registrationData: any = {
      firstName, lastName, email, country, city, whatsapp: whatsapp || null,
      contactType: contactType || 'whatsapp',
      registrationType,
      ownerUid,

      // Business Fields
      businessName: businessName || null,
      category: category || null,
      description: description || null,
      location: location || null,
      address: address || null,
      phone: phone || null,
      website: website || null,
      imageUrl: imageUrl || null,
      imageHint: imageHint || null,
      rating: rating || null,
      currentOfferUrl: currentOfferUrl || null,
      mapUrl: mapUrl || null,
      coords: coords || null,

      // NEW FIELDS - IDENTITY & REFERRAL
      uniqueCode: userCode,
      referrerId: referrerData.id,
      referrerCode: referrerData.code,
      referrerName: referrerData.name,
      inviteId: inviteId || null,

      // EMAIL VERIFICATION
      emailVerificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
      isEmailVerified: false,

      createdAt: new Date(),
      status: 'pending',
    };

    const registrationDocRef = await db.collection('registrations').add(registrationData);

    // 4. Create Client Page (Landing) for Companies
    // "Empresas obtenen su EMDC automaticamente."
    if (isCompany) {
      const clientName = businessName || `${firstName} ${lastName}`;
      const defaultClientData = {
        clientName: clientName,
        clientLogoUrl: imageUrl || '',
        clientTitle: `Bienvenido a ${clientName}`,
        clientSubtitle: 'Esta es tu página de aterrizaje.',
        products: [],
        slug: slugify(clientName) + '-' + userCode.substring(5), // Unique slug
        socialLinks: { instagram: '', facebook: '', linkedin: '' },
        translations: {},
        ownerUid: ownerUid,
        registrationId: registrationDocRef.id,
        // Save ID also in client doc for easier lookup
        uniqueCode: userCode
      };
      await db.collection('clients').add(defaultClientData);
    }

    // 5. Private Profile fallback (Legacy support if mixed types come here)
    if (registrationType === 'private' && ownerUid) {
      await createPrivateUserProfile(ownerUid, {
        firstName, lastName, email, country, city, whatsapp, phone,
        contactType: contactType as 'whatsapp' | 'telegram' | undefined,
        // If it was REFONL, we pass undefined so the service doesn't try to look up a user
        referralCode: referrerData.isRefonl ? undefined : referrerData.code
      });
      // Note: createPrivateUserProfile handles its own ID generation usually.
      // We might have redundant IDs if we don't sync. But for now, company logic is priority.
    }

    // 6. REWARD ENGINE (The "Kill Switch" Logic)
    // Now uses resolveRewards to determine amounts for both parties.
    try {
        const rewards = await resolveRewards(inviteId, email);
        const rewardSender = rewards.rewardSender;
        const rewardReceiver = rewards.rewardReceiver;
        const resolvedReferrerId = rewards.referrerId || (referrerData.id !== 'SYSTEM_REFONL' ? referrerData.id : null);

        if (ownerUid) {
            // A. Pay New User (Receiver)
            await db.runTransaction(async (t) => {
                const walletRef = db.collection('wallets').doc(ownerUid);
                t.set(walletRef, {
                    balance: admin.firestore.FieldValue.increment(rewardReceiver),
                    totalEarned: admin.firestore.FieldValue.increment(rewardReceiver),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                const trxRef = db.collection('wallet_transactions').doc();
                t.set(trxRef, {
                    userId: ownerUid,
                    amount: rewardReceiver,
                    type: 'WELCOME_BONUS',
                    description: `Bono de bienvenida por registro${rewards.inviteId ? ' (Invitación)' : ''}`,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
            });

            // B. Pay Referrer (Sender)
            if (resolvedReferrerId && resolvedReferrerId !== ownerUid) {
                await db.runTransaction(async (t) => {
                    const refWalletRef = db.collection('wallets').doc(resolvedReferrerId);
                    t.set(refWalletRef, {
                        balance: admin.firestore.FieldValue.increment(rewardSender),
                        totalEarned: admin.firestore.FieldValue.increment(rewardSender),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    const trxRef = db.collection('wallet_transactions').doc();
                    t.set(trxRef, {
                        userId: resolvedReferrerId,
                        amount: rewardSender,
                        type: 'REFERRAL_REWARD_BUSINESS',
                        description: `Bonus por registro de Empresa: ${businessName || 'Empresa'} (${userCode})`,
                        relatedUserId: ownerUid,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                });
                console.log(`[REWARD] Paid ${rewardSender}/${rewardReceiver} to ${resolvedReferrerId}/${ownerUid}`);
            }
        }

        // C. Update invitation status if applicable
        if (rewards.inviteId) {
            await db.collection('referrals_pioneers').doc(rewards.inviteId).update({
                status: 'converted',
                converted: true,
                convertedAt: admin.firestore.FieldValue.serverTimestamp(),
                convertedUid: ownerUid || null
            });
        }

        // D. MLM Check: See if Referrer should be upgraded to Freelancer or Team Leader
        if (resolvedReferrerId && resolvedReferrerId !== ownerUid) {
            await checkAndUpgradeRank(resolvedReferrerId).catch(err => 
                console.error("[REWARD] MLM Upgrade Error:", err)
            );
        }
    } catch (rewardErr) {
        console.error("Reward Engine Error:", rewardErr);
    }


    // 7. Webhook & Email
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result.data, firestoreId: registrationDocRef.id, ownerUid, userCode, referrerCode: referrerData.code, referrerName: referrerData.name }),
      });
    } catch (e) { /* ignore */ }

    if (email && firstName) {
      const defaultLang = lang || 'es'; 
      await sendWelcomeEmail(email, firstName, defaultLang, registrationData.emailVerificationCode);
    }

    return NextResponse.json({ success: true, message: 'Registration successful.' }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data.', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error occurred.' }, { status: 500 });
  }
}
