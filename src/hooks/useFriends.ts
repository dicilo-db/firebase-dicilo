import { useState, useEffect } from 'react';
import { User, FriendRequest } from '@/types/social';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export function useFriends() {
    const { user: currentUser } = useAuth();
    const [friends, setFriends] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [suggestedNeighbors, setSuggestedNeighbors] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const db = getFirestore(app);

    // 1. Fetch Requests, Friends & Neighbors

    useEffect(() => {
        if (!currentUser?.uid) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // A. Fetch Pending Requests
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

                // B. Fetch Friends (Accepted Requests)
                // We need two queries because we could be the sender OR the receiver
                const qFriendsReceiver = query(
                    collection(db, 'friend_requests'),
                    where('toUserId', '==', currentUser.uid),
                    where('status', '==', 'accepted')
                );
                const qFriendsSender = query(
                    collection(db, 'friend_requests'),
                    where('fromUserId', '==', currentUser.uid),
                    where('status', '==', 'accepted')
                );

                const [receiverSnap, senderSnap] = await Promise.all([
                    getDocs(qFriendsReceiver),
                    getDocs(qFriendsSender)
                ]);

                const friendIds = new Set<string>();
                receiverSnap.forEach(doc => friendIds.add(doc.data().fromUserId));
                senderSnap.forEach(doc => friendIds.add(doc.data().toUserId));

                // Fetch Friend Profiles
                if (friendIds.size > 0) {
                    // Note: Firestore 'in' limit is 30. For production, batching is needed.
                    // Here we fetch friends using individual gets or a filtered list for MVP simplicity 
                    // OR just reuse the 'private_profiles' fetch below to filter.
                    // Let's assume we fetch all visible neighbors and filter for friends for now to save reads, 
                    // or fetch specific docs if we had IDs. 
                    // For now, let's just create dummy User objects if we can't fetch profiles efficiently without ID list,
                    // BUT actually, we can query profiles where 'uid' in [...friendIds].

                    const ids = Array.from(friendIds).slice(0, 30); // MVP Limit
                    if (ids.length > 0) {
                        const qProfiles = query(
                            collection(db, 'private_profiles'),
                            where('uid', 'in', ids)
                        );
                        const profilesSnap = await getDocs(qProfiles);
                        const friendsList: User[] = [];
                        profilesSnap.forEach(doc => {
                            const data = doc.data();
                            friendsList.push({
                                uid: data.uid || doc.id,
                                displayName: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : 'Amigo',
                                photoURL: data.photoURL,
                                neighborhood: data.neighborhood
                            });
                        });
                        setFriends(friendsList);
                    }
                }

                // C. Fetch Suggested Neighbors
                const usersRef = collection(db, 'private_profiles');
                const qNeighbors = query(usersRef, limit(20)); // Limit for safety

                const userSnapshot = await getDocs(qNeighbors);
                const neighbors: User[] = [];
                userSnapshot.forEach(doc => {
                    const data = doc.data();
                    // Exclude self and ALREADY friends
                    if (doc.id !== currentUser.uid && !friendIds.has(doc.id) && (data.uid || doc.id)) {
                        neighbors.push({
                            uid: data.uid || doc.id,
                            displayName: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : 'Vecino',
                            photoURL: data.photoURL,
                            neighborhood: data.neighborhood
                        });
                    }
                });

                setSuggestedNeighbors(neighbors);

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
