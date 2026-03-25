import { useState, useEffect } from 'react';
import { User, FriendRequest } from '@/types/social';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export function useFriends() {
    const { user: currentUser } = useAuth();
    const [friends, setFriends] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [suggestedNeighbors, setSuggestedNeighbors] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const db = getFirestore(app);

    useEffect(() => {
        if (!currentUser?.uid) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Current User Profile to know their location
                const qProfile = query(
                    collection(db, 'private_profiles'),
                    where('uid', '==', currentUser.uid),
                    limit(1)
                );
                const profileSnap = await getDocs(qProfile);
                let currentProfile: any = null;
                if (!profileSnap.empty) {
                    currentProfile = profileSnap.docs[0].data();
                }

                // A. Fetch Pending Requests
                const qRequests = query(
                    collection(db, 'friend_requests'),
                    where('toUserId', '==', currentUser.uid),
                    where('status', '==', 'pending')
                );

                const reqSnapshot = await getDocs(qRequests);
                const reqs: FriendRequest[] = [];
                const fromUserIds = new Set<string>();
                
                reqSnapshot.forEach(doc => {
                    const data = doc.data();
                    reqs.push({ ...data, id: doc.id } as FriendRequest);
                    fromUserIds.add(data.fromUserId);
                });

                if (fromUserIds.size > 0) {
                    const ids = Array.from(fromUserIds).slice(0, 30);
                    const qProfiles = query(
                        collection(db, 'private_profiles'),
                        where('uid', 'in', ids)
                    );
                    const profilesSnap = await getDocs(qProfiles);
                    const profileMap = new Map<string, any>();
                    profilesSnap.forEach(doc => {
                        profileMap.set(doc.data().uid, doc.data());
                    });

                    reqs.forEach(req => {
                        const profile = profileMap.get(req.fromUserId);
                        if (profile) {
                            req.fromUserName = profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Usuario';
                            req.fromUserEmail = profile.email || 'No email';
                        }
                    });
                }
                setPendingRequests(reqs);

                // A2. Fetch Sent Requests
                const qSent = query(
                    collection(db, 'friend_requests'),
                    where('fromUserId', '==', currentUser.uid),
                    where('status', '==', 'pending')
                );
                const sentSnap = await getDocs(qSent);
                const sentReqs: FriendRequest[] = [];
                const sentUserIds = new Set<string>();
                sentSnap.forEach(doc => {
                    const data = doc.data() as FriendRequest;
                    sentReqs.push({ ...data, id: doc.id });
                    sentUserIds.add(data.toUserId);
                });
                setSentRequests(sentReqs);

                // B. Fetch Friends (Accepted Requests)
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

                if (friendIds.size > 0) {
                    const ids = Array.from(friendIds).slice(0, 30);
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

                // C. Fetch Suggested Neighbors intelligently
                const usersRef = collection(db, 'private_profiles');
                let qNeighbors;

                // Priority: Same neighborhood -> Same city -> Global (Fallback)
                if (currentProfile?.neighborhood) {
                    qNeighbors = query(usersRef, where('neighborhood', '==', currentProfile.neighborhood), limit(50));
                } else if (currentProfile?.city) {
                    qNeighbors = query(usersRef, where('city', '==', currentProfile.city), limit(50));
                } else if (currentProfile?.country) {
                    qNeighbors = query(usersRef, where('country', '==', currentProfile.country), limit(50));
                } else {
                    qNeighbors = query(usersRef, limit(50));
                }

                const userSnapshot = await getDocs(qNeighbors);
                let neighbors: any[] = [];
                userSnapshot.forEach(doc => {
                    const data = doc.data();
                    // Exclude self, existing friends, and people we already invited or invited us
                    if (
                        doc.id !== currentUser.uid && 
                        !friendIds.has(doc.id) && 
                        !sentUserIds.has(doc.id) && 
                        !fromUserIds.has(doc.id) && 
                        (data.uid || doc.id)
                    ) {
                        // Exclude empty test profiles to keep it clean
                        if (data.firstName || data.lastName) {
                            neighbors.push({
                                uid: data.uid || doc.id,
                                displayName: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : 'Vecino',
                                photoURL: data.photoURL,
                                neighborhood: data.neighborhood || 'Barrio desconocido',
                                interests: data.interests || [],
                                city: data.city || ''
                            });
                        }
                    }
                });

                // Score neighbors based on interests and location proximity
                const myInterests = currentProfile?.interests || [];
                neighbors.forEach(n => {
                    let score = 0;
                    if (n.neighborhood === currentProfile?.neighborhood) score += 3;
                    if (n.city === currentProfile?.city) score += 2;
                    const matches = (n.interests || []).filter((i: string) => myInterests.includes(i)).length;
                    score += matches;
                    n._score = score;
                });

                // Sort by highest score first
                neighbors.sort((a, b) => b._score - a._score);
                
                // Take top 30 and shuffle them randomly to provide fresh 20 suggestions
                const topCandidates = neighbors.slice(0, 30).sort(() => Math.random() - 0.5);
                setSuggestedNeighbors(topCandidates.slice(0, 20));

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
            const { sendFriendRequestAction } = await import('@/app/actions/social');
            const result = await sendFriendRequestAction(currentUser.uid, toUserId);
            if (result.success) {
                console.log('Friend request sent via server action!');
            } else {
                console.error('Error sending friend request:', result.error);
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            const { respondToFriendRequestAction } = await import('@/app/actions/social');
            const result = await respondToFriendRequestAction(requestId, status);
            
            if (result.success) {
                setPendingRequests(prev => prev.filter(req => req.id !== requestId));
            } else {
                console.error('Error responding to friend request:', result.error);
            }
        } catch (error) {
            console.error('Error responding to friend request:', error);
        }
    };

    return {
        friends,
        pendingRequests,
        sentRequests,
        suggestedNeighbors,
        sendFriendRequest,
        respondToFriendRequest,
        loading
    };
}
