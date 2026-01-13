import { useState, useEffect } from 'react';
import { User, FriendRequest, FriendRequestStatus } from '@/types/social';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export function useFriends() {
    const { user: currentUser } = useAuth();
    const [friends, setFriends] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [suggestedNeighbors, setSuggestedNeighbors] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const db = getFirestore(app);

    // 1. Fetch Friends & Requests
    useEffect(() => {
        if (!currentUser?.uid) return;

        let unsubscribe = () => { };

        try {
            // Simplified query to avoid potential index/composite issues initially
            const qRequests = query(
                collection(db, 'friend_requests'),
                where('toUserId', '==', currentUser.uid)
                // Filter status on client side if needed, or re-add later
            );

            unsubscribe = onSnapshot(qRequests, (snapshot) => {
                const reqs: FriendRequest[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Client-side filtering for safety and debugging
                    if (data.status === 'pending') {
                        reqs.push({ id: doc.id, ...data } as FriendRequest);
                    }
                });
                setPendingRequests(reqs);
            }, (error) => {
                console.error("Firestore Listener Error:", error);
            });
        } catch (err) {
            console.error("Error setting up friend requests listener:", err);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser?.uid, db]);

    // 2. Fetch Suggested Neighbors
    useEffect(() => {
        const fetchNeighbors = async () => {
            if (!currentUser) return;

            // Get current user's neighborhood profile
            // identifying the neighborhood slug...
            // For now, we'll try to find users in the same "neighborhood" field

            // This part depends heavily on how 'neighborhood' is stored on users.
            // Assuming 'private_profiles' has 'neighborhood' field.
            try {
                setLoading(true);
                // This is a placeholder query. 
                // In reality, you'd fetch the user's profile to get their neighborhood first.
                const usersRef = collection(db, 'private_profiles');
                // const q = query(usersRef, where('neighborhood', '==', 'YOUR_NEIGHBORHOOD_SLUG')); 
                // For demo, just fetching recent users
                const q = query(usersRef, where('uid', '!=', currentUser.uid)); // limit(10)

                const snapshot = await getDocs(q);
                const neighbors: User[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    neighbors.push({
                        uid: data.uid || doc.id,
                        displayName: data.firstName ? `${data.firstName} ${data.lastName || ''}` : 'Vecino',
                        photoURL: data.photoURL,
                        neighborhood: data.neighborhood
                    });
                });
                setSuggestedNeighbors(neighbors);
            } catch (error) {
                console.error("Error fetching neighbors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNeighbors();
    }, [currentUser?.uid, db]);

    const sendFriendRequest = async (toUserId: string) => {
        if (!currentUser) return;
        try {
            await addDoc(collection(db, 'friend_requests'), {
                fromUserId: currentUser.uid,
                toUserId,
                status: 'pending',
                createdAt: Date.now()
            });
            console.log('Friend request sent!');
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            await updateDoc(doc(db, 'friend_requests', requestId), {
                status,
                updatedAt: Date.now()
            });

            if (status === 'accepted') {
                // Logic to add to friends list (e.g. create documents in 'friends' subcollection for both users)
                // await addDoc(...)
            }
        } catch (error) {
            console.error('Error responding to friend request:', error);
        }
    };

    return {
        friends,
        pendingRequests,
        suggestedNeighbors,
        sendFriendRequest,
        respondToFriendRequest,
        loading
    };
}
