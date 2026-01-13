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
import { UserPlus, MessageCircle, X, Check } from 'lucide-react';

// Hooks & Services
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { chatService } from '@/lib/chat-service';
import { Message as SocialMessage } from '@/types/social';

export function SocialPanel() {
    const { t } = useTranslation('social');
    const { user } = useAuth();
    const { suggestedNeighbors, pendingRequests, sendFriendRequest, respondToFriendRequest } = useFriends();

    // State
    const [activeTab, setActiveTab] = useState<'friends' | 'chats'>('chats');
    const [activeChatRoom, setActiveChatRoom] = useState<string | null>(null);
    const [messages, setMessages] = useState<SocialMessage[]>([]);
    const [inputText, setInputText] = useState('');

    // Socket Connection
    useEffect(() => {
        if (user) {
            chatService.connect('dummy-token'); // Replace with real token logic if needed

            chatService.onMessageReceived((msg) => {
                setMessages((prev) => [...prev, msg]);
            });

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
        <div style={{ position: "relative", height: "600px" }} className="dicilo-social-wrapper w-full border rounded-lg overflow-hidden bg-white shadow-sm">
            <MainContainer responsive>

                {/* --- BARRA LATERAL --- */}
                <Sidebar position="left" scrollable={false}>

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

                {/* --- ÁREA DE CHAT --- */}
                <ChatContainer>
                    {activeChatRoom ? (
                        <>
                            <ConversationHeader>
                                <ConversationHeader.Back onClick={() => setActiveChatRoom(null)} />
                                <Avatar src="https://ui-avatars.com/api/?name=Chat" name="Active" />
                                <ConversationHeader.Content
                                    userName="Chat Activo" // In real app, resolved from room ID
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
                                                sender: m.senderId === user?.uid ? "Me" : "Other", // Chatscope needs "Me" for outgoing
                                                direction: getDirection(m.senderId),
                                                position: "single"
                                            }}
                                        >
                                            <Message.CustomContent>
                                                {/* Optional: Add avatars next to message if group chat */}
                                            </Message.CustomContent>
                                        </Message>
                                    ))}
                            </MessageList>

                            <MessageInput
                                placeholder={t('social.placeholder.type_message')}
                                value={inputText}
                                onChange={setInputText}
                                onSend={handleSendMessage}
                                attachButton={false}
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                            <MessageCircle size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">{t('social.tabs.chats')}</p>
                            <p className="text-sm opacity-60 max-w-xs mt-2">
                                {t('social.actions.start_chat_prompt', 'Selecciona un chat o busca un vecino para comenzar a conectar.')}
                            </p>
                        </div>
                    )}
                </ChatContainer>
            </MainContainer>
        </div>
    );
}
