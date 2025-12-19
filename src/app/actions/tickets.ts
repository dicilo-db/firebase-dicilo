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

        await ticketRef.update({
            messages: admin.firestore.FieldValue.arrayUnion({
                ...message,
                timestamp: new Date().toISOString()
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
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
