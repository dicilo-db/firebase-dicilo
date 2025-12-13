'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { chatAction } from '@/app/actions/chat';
import Image from 'next/image';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

import { getGreetingAction } from '@/app/actions/greeting';
import { extractTextFromDocument } from '@/app/actions/upload';
import { Paperclip, FileText } from 'lucide-react';

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
        if ((!inputValue.trim() && !selectedFile) || isLoading) return;

        let userContent = inputValue;
        if (selectedFile) {
            userContent += ` [Anhänge: ${selectedFile.name}]`;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userContent,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        const fileToUpload = selectedFile;
        setSelectedFile(null); // Clear formatting immediately
        setIsLoading(true);

        try {
            let context = '';
            if (fileToUpload) {
                const formData = new FormData();
                formData.append('file', fileToUpload);
                const uploadResult = await extractTextFromDocument(formData);
                if (uploadResult.success && uploadResult.text) {
                    context = uploadResult.text;
                } else {
                    console.error('File processing failed:', uploadResult.error);
                    // Optionally notify user
                }
            }

            const result = await chatAction({
                question: userMessage.content,
                context: context
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
                content: 'Sorry, I encountered an error. Please try again.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('File size too large (max 5MB)');
                return;
            }
            setSelectedFile(file);
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
                                <Image src="/dicibot.jpg" alt="Dicilo Bot" fill className="object-cover" />
                            </div>
                            Dicilo AI Assistant
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
                                            className={`rounded-lg p-3 text-sm ${message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-foreground'
                                                }`}
                                        >
                                            {message.content}
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
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                className="flex-grow"
                            />
                            <Input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.txt"
                                onChange={handleFileSelect}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                className={selectedFile ? "bg-primary/20" : ""}
                            >
                                <Paperclip className="w-4 h-4" />
                            </Button>
                            <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                                <Send className="w-4 h-4" />
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
