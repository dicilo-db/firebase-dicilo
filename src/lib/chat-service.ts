import { io, Socket } from 'socket.io-client';
import { Message } from '@/types/social';

// Placeholder URL - This would usually come from env vars
// const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
// For now, we'll keep it as a placeholder string that needs to be configured
const SOCKET_URL = 'http://localhost:4000';

class ChatService {
    private socket: Socket | null = null;
    private static instance: ChatService;

    private constructor() { }

    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    public connect(authToken: string) {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            auth: { token: authToken },
            autoConnect: true,
            reconnection: true,
        });

        this.socket.on('connect', () => {
            console.log('ChatService: Connected to socket server', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('ChatService: Disconnected from socket server');
        });

        this.socket.on('connect_error', (err) => {
            console.error('ChatService: Connection error', err);
        });
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public joinRoom(roomId: string) {
        if (this.socket) {
            this.socket.emit('join_room', roomId);
        }
    }

    public leaveRoom(roomId: string) {
        if (this.socket) {
            this.socket.emit('leave_room', roomId);
        }
    }

    public sendMessage(roomId: string, content: string, senderId: string) {
        if (this.socket) {
            const messagePayload = {
                roomId,
                content,
                senderId,
                timestamp: Date.now(),
            };
            this.socket.emit('send_message', messagePayload);
        }
    }

    public onMessageReceived(callback: (message: Message) => void) {
        if (!this.socket) return;

        // Remove previous listeners to avoid duplicates if re-registered
        this.socket.off('receive_message');

        this.socket.on('receive_message', (message: Message) => {
            callback(message);
        });
    }

    public offMessageReceived() {
        if (this.socket) {
            this.socket.off('receive_message');
        }
    }
}

export const chatService = ChatService.getInstance();
