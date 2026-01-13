import { useState, useEffect } from 'react';
import { User, FriendRequest } from '@/types/social';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export function useFriends() {
    const { user: currentUser } = useAuth();
    const [friends, setFriends] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [suggestedNeighbors, setSuggestedNeighbors] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const db = getFirestore(app);

    // 1. Fetch Requests & Neighbors (One-time fetch on mount/user change)
    useEffect(() => {
        if (!currentUser?.uid) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // A. Fetch Pending Requests
                // We use getDocs instead of onSnapshot to prevent 'Internal Assertion Failed' crashes
                // caused by unstable listener states in the current environment.
                const qRequests = query(
                    collection(db, 'friend_requests'),
                    where('toUserId', '==', currentUser.uid),
                    where('status', '==', 'pending')
                );

                const reqSnapshot = await getDocs(qRequests);
                const reqs: FriendRequest[] = [];
                reqSnapshot.forEach(doc => {
                    reqs.push({ id: doc.id, ...doc.data() } as FriendRequest);
                });
                setPendingRequests(reqs);

                // B. Fetch Suggested Neighbors
                // Logic: Fetch other profiles. Ideally filtered by neighborhood.
                // For robustness, we simply fetch a limited number of profiles excluding self.
                const usersRef = collection(db, 'private_profiles');
                // Note: '!=' queries can sometimes be restrictive on indexes. 
                // A safer simple query is often just limit(20) and filter in JS.
                const qNeighbors = query(usersRef);

                const userSnapshot = await getDocs(qNeighbors);
                const neighbors: User[] = [];
                userSnapshot.forEach(doc => {
                    const data = doc.data();
                    // Exclude self and ensure minimal data integrity
                    if (doc.id !== currentUser.uid && (data.uid || doc.id)) {
                        neighbors.push({
                            uid: data.uid || doc.id,
                            displayName: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : 'Vecino',
                            photoURL: data.photoURL,
                            neighborhood: data.neighborhood
                        });
                    }
                });

                // Randomize or filter neighbors if needed
                setSuggestedNeighbors(neighbors.slice(0, 10));

            } catch (error) {
                console.error("Error fetching social data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser?.uid, db]);

    const sendFriendRequest = async (toUserId: string) => {
        if (!currentUser?.uid) return;
        try {
            await addDoc(collection(db, 'friend_requests'), {
                fromUserId: currentUser.uid,
                toUserId,
                status: 'pending',
                createdAt: Date.now()
            });
            // Optional: Optimistically update UI or re-fetch
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

            // Remove from local state immediately
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));

            if (status === 'accepted') {
                // Logic to add to friends list would go here
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
