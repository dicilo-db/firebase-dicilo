'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Loader2, Bot, User, Mic, MicOff } from 'lucide-react';
import { chatAction } from '@/app/actions/chat';
import Image from 'next/image';
import { getGreetingAction } from '@/app/actions/greeting';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

// Add global declaration for Web Speech API
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

interface AiChatWidgetProps {
    // greeting property removed as we fetch it internally now
}

export function AiChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '...', // Placeholder until fetched
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [userId, setUserId] = useState<string>(''); // User Identity State
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when loading finishes
    useEffect(() => {
        if (!isLoading && isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isLoading, isOpen]);

    // Auth & Identity Logic
    useEffect(() => {
        // Import dynamically to avoid SSR issues if any, though regular import is fine in 'use client'
        const { auth } = require('@/lib/firebase');
        const { onAuthStateChanged } = require('firebase/auth');

        const unsubscribe = onAuthStateChanged(auth, (user: any) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // Anonymous Session logic
                let sessionUid = sessionStorage.getItem('dicilo_anon_uid');
                if (!sessionUid) {
                    sessionUid = 'anon_' + Math.random().toString(36).substr(2, 9);
                    sessionStorage.setItem('dicilo_anon_uid', sessionUid);
                }
                setUserId(sessionUid);
            }
        });

        return () => unsubscribe();
    }, []);

    // Speech Recognition Logic
    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-ES'; // Default to Spanish or detect from detecting.ts logic ideally
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
            };

            recognition.start();
        } else {
            alert('Speech recognition not supported in this browser.');
        }
    };

    useEffect(() => {
        // Fetch personalized greeting on mount
        const fetchGreeting = async () => {
            const greeting = await getGreetingAction();
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[0].id === 'welcome') {
                    newMessages[0].content = greeting;
                }
                return newMessages;
            });
        };
        fetchGreeting();
    }, []);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        let userContent = inputValue;
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userContent,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            let context = '';
            // File processing removed

            const result = await chatAction({
                question: userMessage.content,
                context: context,
                userId: userId // Pass the identified user ID
            });

            if (!result.success || !result.answer) {
                throw new Error(result.error || 'Unknown error');
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.answer,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };



    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <Card className="w-[350px] h-[500px] flex flex-col shadow-xl border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-primary/5">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                <Image src="/dicibot.jpg" alt="DiciBot" fill className="object-cover" />
                            </div>
                            DiciBot <span className="text-xs text-muted-foreground ml-1">(v2.0)</span>
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 overflow-hidden">
                        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                            <div className="flex flex-col gap-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                                            }`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                                }`}
                                        >
                                            {message.role === 'user' ? (
                                                <User className="w-4 h-4" />
                                            ) : (
                                                <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                                    <Image src="/dicibot.jpg" alt="Bot" fill className="object-cover" />
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className={`rounded-lg p-3 text-sm break-words ${message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-foreground'
                                                }`}
                                        >
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ node, ...props }) => (
                                                        <a {...props} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-500 transition-colors" />
                                                    ),
                                                    p: ({ node, ...props }) => <p {...props} className="mb-1 last:mb-0 leading-relaxed" />,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-2 max-w-[80%]">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                                            <Image src="/dicibot.jpg" alt="Bot" fill className="object-cover" />
                                        </div>
                                        <div className="bg-muted rounded-lg p-3 flex items-center">
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-3 border-t bg-background">
                        <div className="flex w-full gap-2">
                            <Input
                                ref={inputRef}
                                autoFocus
                                placeholder="Escribe un mensaje..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                className="flex-grow"
                            />
                            {/* File Upload Removed as per user request */}
                            <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={startListening}
                                className={isListening ? "text-red-500 animate-pulse" : "text-muted-foreground"}
                                disabled={isLoading}
                                title="Hablar con DiciBot"
                            >
                                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className="rounded-full h-12 w-12 shadow-lg hover:scale-105 transition-transform p-0 overflow-hidden"
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image src="/dicibot.jpg" alt="Chat" fill className="object-cover" />
                    </div>
                )}
            </Button>
        </div>
    );
}
