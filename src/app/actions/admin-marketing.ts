'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getTemplate } from '@/actions/email-templates';
import { sendSmtpEmail } from '@/lib/mail-service';
import { FieldValue } from 'firebase-admin/firestore';

export interface MarketingLead {
    id: string;
    friendName: string;
    friendEmail: string;
    phone?: string;
    city?: string;
    country?: string;
    companyName?: string;
    category?: string;
    status: string;
    template?: string;
    createdAt: string;
    converted?: boolean;
    convertedAt?: string;
    referrerId?: string;
    referrerName?: string;
    notes?: string;
}

export async function getAllMarketingLeads() {
    try {
        const db = getAdminDb();
        const snapshot = await db.collection('referrals_pioneers')
            .orderBy('createdAt', 'desc')
            .get();

        const leads: MarketingLead[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                friendName: data.friendName || 'N/A',
                friendEmail: data.friendEmail || 'N/A',
                phone: data.phone || data.friendPhone || '',
                city: data.city || data.friendCity || '',
                country: data.country || data.friendCountry || '',
                companyName: data.companyName || '',
                category: data.category || '',
                status: data.status || 'sent',
                template: data.template || 'default',
                converted: !!data.converted,
                convertedAt: data.convertedAt?.toDate ? data.convertedAt.toDate().toISOString() : undefined,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                referrerId: data.referrerId || '',
                referrerName: data.referrerName || '',
                notes: data.notes || ''
            };
        });

        return { success: true, leads };
    } catch (error: any) {
        console.error('Error fetching all marketing leads:', error);
        return { success: false, error: error.message };
    }
}

export async function updateMarketingLead(leadId: string, data: Partial<MarketingLead>) {
    try {
        const db = getAdminDb();
        await db.collection('referrals_pioneers').doc(leadId).update({
            ...data,
            updatedAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sendMarketingEmail(leadId: string, templateId: string) {
    try {
        const db = getAdminDb();
        const leadRef = db.collection('referrals_pioneers').doc(leadId);
        const doc = await leadRef.get();

        if (!doc.exists) return { success: false, error: 'Lead not found' };

        const data = doc.data() as any;
        const email = data.friendEmail || data.email;
        if (!email) return { success: false, error: 'No email found for lead' };

        const template = await getTemplate(templateId);
        if (!template) return { success: false, error: 'Template not found' };

        // Determine language
        const lang = data.country === 'Deutschland' || data.country === 'Germany' ? 'de' : 'es';
        let templateVersion = template.versions[lang] || template.versions['es'] || Object.values(template.versions)[0];

        if (!templateVersion) return { success: false, error: 'No valid template version found' };

        let { subject, body } = templateVersion;

        // Replace variables
        const vars: Record<string, string> = {
            '{{nombre}}': data.friendName || 'Usuario',
            '{{empresa}}': data.companyName || '',
            '{{tu_nombre}}': data.referrerName || 'Equipo Dicilo',
            '{{referrer_name}}': data.referrerName || 'Equipo Dicilo'
        };

        for (const [key, val] of Object.entries(vars)) {
            const regex = new RegExp(key, 'gi');
            subject = subject.replace(regex, val);
            body = body.replace(regex, val);
        }

        const html = body.replace(/\n/g, '<br/>');

        const result = await sendSmtpEmail({ to: email, subject, html });
        if (!result.success) return { success: false, error: result.error };

        // Update lead status
        await leadRef.update({
            status: 'email_sent',
            lastTemplateSent: templateId,
            lastSentAt: FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function convertLeadToClient(leadId: string, targetType: string) {
    try {
        const db = getAdminDb();
        const leadRef = db.collection('referrals_pioneers').doc(leadId);
        const leadDoc = await leadRef.get();

        if (!leadDoc.exists) return { success: false, error: 'Lead not found' };
        const leadData = leadDoc.data() as any;

        // 1. Create Business
        const businessData = {
            name: leadData.companyName || leadData.friendName || 'Sin Nombre',
            category: leadData.category || 'General',
            email: leadData.friendEmail || '',
            phone: leadData.phone || leadData.friendPhone || '',
            location: leadData.city ? `${leadData.city}, ${leadData.country || ''}` : (leadData.country || ''),
            address: leadData.city || '',
            active: true,
            createdAt: FieldValue.serverTimestamp(),
            source: 'marketing_campaign',
            sourceId: leadId
        };

        const businessRef = await db.collection('businesses').add(businessData);
        const businessId = businessRef.id;

        // 2. Create Client if it's not just a business
        if (targetType !== 'business') {
            const clientData = {
                businessId: businessId,
                clientName: businessData.name,
                clientType: targetType, // starter, retailer, premium
                email: businessData.email,
                phone: businessData.phone,
                active: true,
                createdAt: FieldValue.serverTimestamp(),
                subscriptionStatus: 'active',
            };
            await db.collection('clients').add(clientData);
        }

        // 3. Mark lead as converted
        await leadRef.update({
            converted: true,
            convertedAt: FieldValue.serverTimestamp(),
            convertedToBusinessId: businessId,
            status: 'converted'
        });

        return { success: true, businessId };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
