'use client';

import React, { useState, useEffect } from 'react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
    MainContainer,
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
    Sidebar,
    ConversationList,
    Conversation,
    Avatar,
    ConversationHeader,
    Search
} from '@chatscope/chat-ui-kit-react';
import { UserPlus, MessageCircle, X, Check, Send, Image as ImageIcon, Loader2 } from 'lucide-react';

// Hooks & Services
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { chatService } from '@/lib/chat-service';
import { Message as SocialMessage } from '@/types/social';

import { CommunityFeed } from '../../community/CommunityFeed';

export function SocialPanel({ neighborhood = 'Hamburg' }: { neighborhood?: string }) {
    const { t } = useTranslation('social');
    const { user } = useAuth();
    const { suggestedNeighbors, pendingRequests, sendFriendRequest, respondToFriendRequest, friends } = useFriends();

    // Extract friend IDs for the private feed query
    const friendIds = React.useMemo(() => {
        return friends.map(f => f.uid);
    }, [friends]);


    // State
    const [activeTab, setActiveTab] = useState<'friends' | 'chats'>('chats');
    const [activeChatRoom, setActiveChatRoom] = useState<string | null>(null);
    const [messages, setMessages] = useState<SocialMessage[]>([]);
    const [inputText, setInputText] = useState('');

    // Socket Connection
    useEffect(() => {
        if (user) {
            // NOTE: Real-time connection disabled until Backend (Socket.io) is running on port 4000.
            // Uncomment the lines below when the server is ready to avoid 'Connection Refused' errors.

            // chatService.connect('dummy-token'); 

            // chatService.onMessageReceived((msg) => {
            //     setMessages((prev) => [...prev, msg]);
            // });

            return () => {
                chatService.disconnect();
            };
        }
    }, [user]);

    // Handlers
    const handleSendMessage = (text: string) => {
        if (!activeChatRoom || !user) return;

        chatService.sendMessage(activeChatRoom, text, user.uid);

        // Optimistic UI update
        const newMsg: SocialMessage = {
            id: Date.now().toString(),
            roomId: activeChatRoom,
            senderId: user.uid,
            content: text,
            timestamp: Date.now(),
            readBy: []
        };
        setMessages((prev) => [...prev, newMsg]);
        setInputText('');
    };

    const handleStartChat = (friendId: string) => {
        const dummyRoomId = `room-${friendId}`;
        chatService.joinRoom(dummyRoomId);
        setActiveChatRoom(dummyRoomId);
        setActiveTab('chats');
    };

    // Helper to determine message alignment
    const getDirection = (senderId: string) => {
        return senderId === user?.uid ? "outgoing" : "incoming";
    };

    return (
        <div style={{ position: "relative", height: "750px" }} className="dicilo-social-wrapper w-full border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
            <MainContainer responsive>

                {/* --- BARRA LATERAL --- */}
                <Sidebar position="left" scrollable={false}>
                    {/* ... sidebar content remains same ... */}
                    {/* Custom Toggle using Primary Color (Dicilo Green) */}
                    <div className="p-3 bg-primary flex justify-around items-center text-primary-foreground shadow-sm">
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`py-1 px-3 rounded-full text-sm transition-colors ${activeTab === 'chats' ? 'bg-white/20 font-bold' : 'hover:bg-white/10'}`}
                        >
                            {t('social.tabs.chats')}
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`py-1 px-3 rounded-full text-sm transition-colors ${activeTab === 'friends' ? 'bg-white/20 font-bold' : 'hover:bg-white/10'}`}
                        >
                            {t('social.tabs.friends')}
                        </button>
                    </div>

                    {/* Sidebar Content based on Tab */}
                    {activeTab === 'chats' ? (
                        <div className="h-full flex flex-col">
                            <Search placeholder={t('social.placeholder.search_neighbor')} className="p-2" />
                            <ConversationList>
                                <div className="p-4 text-center text-sm text-gray-500">
                                    {activeChatRoom ? null : t('social.list.no_chats', 'No tienes chats activos.')}
                                </div>
                            </ConversationList>
                        </div>
                    ) : (
                        <div className="p-4 overflow-y-auto h-full space-y-6 bg-slate-50">

                            {/* Solicitudes Pendientes */}
                            {pendingRequests.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                        {t('social.headers.pending_requests')}
                                    </h3>
                                    <div className="space-y-3">
                                        {pendingRequests.map(req => (
                                            <div key={req.id} className="bg-white p-3 rounded-md shadow-sm border flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">{t('social.list.user_label')} {req.fromUserId}</span>
                                                <div className="flex gap-1">
                                                    <button
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                        title={t('social.actions.reject_request')}
                                                        onClick={() => respondToFriendRequest(req.id, 'rejected')}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                                        title={t('social.actions.accept_request')}
                                                        onClick={() => respondToFriendRequest(req.id, 'accepted')}
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vecinos Sugeridos / Amigos */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                    {t('social.headers.suggested_neighbors')}
                                </h3>

                                {suggestedNeighbors.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-4">
                                        {t('social.headers.no_new_neighbors')}
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {suggestedNeighbors.map((neighbor) => (
                                            <div key={neighbor.uid} className="bg-white p-3 rounded-md shadow-sm border flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={neighbor.photoURL || `https://ui-avatars.com/api/?name=${neighbor.displayName}`} name={neighbor.displayName} />
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-bold text-gray-800 truncate">{neighbor.displayName}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                                                            {neighbor.neighborhood || t('social.list.unknown_neighborhood')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                                                        title={t('social.actions.add_friend')}
                                                        onClick={() => sendFriendRequest(neighbor.uid)}
                                                    >
                                                        <UserPlus size={18} />
                                                    </button>
                                                    <button
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                        title={t('social.actions.start_chat')}
                                                        onClick={() => handleStartChat(neighbor.uid)}
                                                    >
                                                        <MessageCircle size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Sidebar>

                {/* --- ÁREA DE CHAT O MURO --- */}
                {/* --- Main Content Area: CHAT or PRIVATE WALL --- */}
                {activeChatRoom ? (
                    <ChatContainer>
                        <ConversationHeader>
                            <ConversationHeader.Back onClick={() => setActiveChatRoom(null)} />
                            <Avatar src="https://ui-avatars.com/api/?name=Chat" name="Active" />
                            <ConversationHeader.Content
                                userName="Chat Activo"
                                info={t('social.status.online')}
                            />
                        </ConversationHeader>

                        <MessageList>
                            {messages
                                .filter(m => m.roomId === activeChatRoom)
                                .map((m) => (
                                    <Message
                                        key={m.id}
                                        model={{
                                            message: m.content,
                                            sentTime: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                            sender: m.senderId === user?.uid ? "Me" : "Other",
                                            direction: getDirection(m.senderId),
                                            position: "single"
                                        }}
                                    />
                                ))}
                        </MessageList>

                        {/* Chat Input Area */}
                        <div className="p-3 bg-white border-t">
                            {/* ... existing input code ... */}
                            <div className="space-y-2">
                                <textarea
                                    className="w-full p-3 min-h-[80px] text-sm border-slate-200 bg-slate-50 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder={t('social.placeholder.type_message')}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(inputText);
                                        }
                                    }}
                                />
                                <div className="flex justify-between items-center">
                                    <button className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-slate-100">
                                        <ImageIcon size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleSendMessage(inputText)}
                                        disabled={!inputText.trim()}
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>{t('social.actions.send', 'Enviar')}</span>
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </ChatContainer>
                ) : (
                    /* PRIVATE CIRCLE FEED (Standard View) */
                    <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 flex flex-col">
                        {/* Feed Header */}
                        <div className="p-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    Mi Círculo Privado
                                    <span className="text-xs bg-amber-100 text-amber-700 font-normal px-2 py-0.5 rounded-full border border-amber-200">
                                        Solo Amigos
                                    </span>
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Las publicaciones aquí son privadas y solo visibles para tus contactos.
                                </p>
                            </div>
                            {/* Optional: Add "Find Friends" button here if empty */}
                        </div>

                        {/* Feed Content */}
                        <div className="p-4 flex-1">
                            {user ? (
                                <CommunityFeed
                                    neighborhood={neighborhood} // Still passed but ignored for visibility, used for "CreatePost" placeholder if needed or as fallback
                                    userId={user.uid}
                                    mode="private"
                                    friendIds={friendIds}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </MainContainer>
        </div>
    );
}
