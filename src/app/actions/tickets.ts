'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export interface Ticket {
    id: string;
    uid: string;
    userName: string;
    userEmail: string;
    title: string;
    description: string;
    module: string;
    status: 'open' | 'in_progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
    attachments?: string[];
    assignedRoles?: string[]; // Roles that can view/manage this ticket
    createdAt: any;
    updatedAt: any;
    messages?: TicketMessage[];
}

export interface TicketMessage {
    id?: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: any;
}

// Helper to check role server-side
async function getRequestorRole(uid: string): Promise<string | null> {
    try {
        const doc = await getAdminDb().collection('private_profiles').doc(uid).get();
        if (doc.exists) {
            return doc.data()?.role || null;
        }
        return null;
    } catch (e) {
        console.error('Error fetching role:', e);
        return null;
    }
}

export async function createTicket(data: {
    uid: string;
    userName: string;
    userEmail: string;
    title: string;
    description: string;
    module: string;
    priority: 'low' | 'medium' | 'high';
    attachments?: string[];
}) {
    try {
        if (!data.uid) return { success: false, error: 'Unauthorized' };

        const ticketData = {
            ...data,
            status: 'open',
            attachments: data.attachments || [],
            assignedRoles: [], // Default: Only Superadmin sees it (implied)
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            messages: []
        };

        const docRef = await getAdminDb().collection('tickets').add(ticketData);

        // Send notification email
        try {
            const { sendTicketCreatedEmail } = await import('@/lib/email');
            await sendTicketCreatedEmail(data.userEmail, docRef.id, data.title, data.description);
        } catch (emailError) {
            console.error('Failed to send ticket email:', emailError);
        }

        return { success: true, ticketId: docRef.id };
    } catch (error: any) {
        console.error('Error creating ticket:', error);
        return { success: false, error: error.message };
    }
}

export async function getUserTickets(uid: string) {
    try {
        const snapshot = await getAdminDb().collection('tickets')
            .where('uid', '==', uid)
            .get();

        const tickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString(),
        })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, tickets };
    } catch (error: any) {
        console.error('Error fetching tickets:', error);
        return { success: false, error: error.message };
    }
}

export async function getTicket(ticketId: string) {
    try {
        const docSnap = await getAdminDb().collection('tickets').doc(ticketId).get();

        if (!docSnap.exists) {
            return { success: false, error: 'Ticket not found' };
        }

        const data = docSnap.data();
        return {
            success: true,
            ticket: {
                id: docSnap.id,
                ...data,
                createdAt: data?.createdAt?.toDate().toISOString(),
                updatedAt: data?.updatedAt?.toDate().toISOString(),
                messages: data?.messages || []
            }
        };
    } catch (error: any) {
        console.error('Error fetching ticket:', error);
        return { success: false, error: error.message };
    }
}

export async function addTicketMessage(ticketId: string, message: {
    senderId: string;
    senderName: string;
    message: string;
}) {
    try {
        const ticketRef = getAdminDb().collection('tickets').doc(ticketId);

        // Get ticket first
        const ticketSnap = await ticketRef.get();
        if (!ticketSnap.exists) throw new Error('Ticket not found');
        const ticketData = ticketSnap.data();

        const newMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        };

        await ticketRef.update({
            messages: admin.firestore.FieldValue.arrayUnion(newMessage),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Email Notification Logic
        if (ticketData?.uid && message.senderId !== ticketData.uid) {
            try {
                const { sendTicketReplyEmail } = await import('@/lib/email');
                if (sendTicketReplyEmail) {
                    await sendTicketReplyEmail(
                        ticketData.userEmail,
                        ticketId,
                        ticketData.title || 'Support Ticket',
                        message.message,
                        message.senderName
                    );
                }
            } catch (emailError: any) {
                console.error('Failed to send reply email:', emailError);
            }
        }

        try {
            const { revalidatePath } = await import('next/cache');
            revalidatePath(`/dashboard/tickets/${ticketId}`);
            revalidatePath(`/admin/tickets/${ticketId}`);
        } catch (e) { console.error('Revalidate failed', e); }

        return { success: true };
    } catch (error: any) {
        console.error('Error adding message:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllTickets(requestorUid?: string) {
    try {
        let role = null;
        if (requestorUid) {
            role = await getRequestorRole(requestorUid);
        }

        // Fetch all tickets ordered by creation
        const snapshot = await getAdminDb().collection('tickets')
            .orderBy('createdAt', 'desc')
            .get();

        let tickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString(),
        })) as Ticket[];

        // Filter based on role
        if (role !== 'superadmin') {
            // If not superadmin, only show tickets assigned to their role
            // Or if they are the creator (though this function is for admin pool)
            tickets = tickets.filter(t => {
                const assigned = t.assignedRoles || [];
                return assigned.includes(role || '') || (requestorUid && t.uid === requestorUid);
            });
        }

        return { success: true, tickets, role };
    } catch (error: any) {
        console.error('Error fetching all tickets:', error);
        return { success: false, error: error.message };
    }
}

export async function editTicketMessage(ticketId: string, messageId: string, newText: string) {
    try {
        const ticketRef = getAdminDb().collection('tickets').doc(ticketId);
        const ticketSnap = await ticketRef.get();
        if (!ticketSnap.exists) throw new Error('Ticket not found');

        const data = ticketSnap.data();
        const messages = data?.messages || [];

        let editedMsg: any = null;

        const updatedMessages = messages.map((msg: any) => {
            if (msg.id === messageId) {
                editedMsg = msg;
                return { ...msg, message: newText };
            }
            return msg;
        });

        if (!editedMsg) return { success: false, error: 'Message not found' };

        await ticketRef.update({ messages: updatedMessages });

        // Notify user of correction if it's admin's message
        if (data?.uid && editedMsg.senderId !== data.uid) {
            try {
                const { sendTicketReplyEmail } = await import('@/lib/email');
                await sendTicketReplyEmail(
                    data.userEmail,
                    ticketId,
                    data.title || 'Support Ticket Update',
                    newText,
                    editedMsg.senderName + ' (Correction)'
                );
            } catch (emailError) {
                console.error('Failed to send correction email:', emailError);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error editing message:', error);
        return { success: false, error: error.message };
    }
}

export async function assignTicketRoles(ticketId: string, requestorUid: string, roles: string[]) {
    try {
        // Verify requestor is superadmin
        const requestorRole = await getRequestorRole(requestorUid);
        if (requestorRole !== 'superadmin') {
            return { success: false, error: 'Only Superadmin can assign tickets.' };
        }

        await getAdminDb().collection('tickets').doc(ticketId).update({
            assignedRoles: roles
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error assigning roles:', error);
        return { success: false, error: error.message };
    }
}
