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
    module: string; // Added module
    status: 'open' | 'in_progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
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

export async function createTicket(data: {
    uid: string;
    userName: string;
    userEmail: string;
    title: string;
    description: string;
    module: string; // Added module
    priority: 'low' | 'medium' | 'high';
}) {
    try {
        if (!data.uid) return { success: false, error: 'Unauthorized' };

        const ticketData = {
            ...data,
            status: 'open',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            messages: []
        };

        const docRef = await getAdminDb().collection('tickets').add(ticketData);

        // Send notification email to user
        try {
            const { sendTicketCreatedEmail } = await import('@/lib/email');
            await sendTicketCreatedEmail(data.userEmail, docRef.id, data.title, data.description);
        } catch (emailError) {
            console.error('Failed to send ticket email:', emailError);
            // Don't fail the ticket creation if email fails
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
            .orderBy('createdAt', 'desc')
            .get();

        const tickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Serialize timestamps for client
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString(),
        }));

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
                messages: data?.messages || [] // Ensure messages are returned
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

        // Get ticket first to find recipient
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

        let emailWarning = '';
        // Send email notification if the sender is NOT the ticket owner
        if (ticketData?.uid && message.senderId !== ticketData.uid) {
            try {
                const { sendTicketReplyEmail } = await import('@/lib/email');
                if (!sendTicketReplyEmail) {
                    emailWarning = 'Email service not found';
                } else {
                    const emailResult = await sendTicketReplyEmail(
                        ticketData.userEmail,
                        ticketId,
                        ticketData.title || 'Support Ticket',
                        message.message,
                        message.senderName
                    );
                    if (!emailResult || !emailResult.success) {
                        emailWarning = `Email failed: ${emailResult?.error || 'Unknown error'}`;
                        console.error('Email send failed:', emailResult?.error);
                    }
                }
            } catch (emailError: any) {
                console.error('Failed to send reply email:', emailError);
                emailWarning = `Email error: ${emailError.message}`;
            }
        }

        try {
            const { revalidatePath } = await import('next/cache');
            revalidatePath(`/dashboard/tickets/${ticketId}`);
            revalidatePath(`/admin/tickets/${ticketId}`);
        } catch (e) { console.error('Revalidate failed', e); }

        return { success: true, emailWarning };
    } catch (error: any) {
        console.error('Error adding message:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllTickets() {
    try {
        const snapshot = await getAdminDb().collection('tickets')
            .orderBy('createdAt', 'desc')
            .get();

        const tickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString(),
        }));

        return { success: true, tickets };
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
