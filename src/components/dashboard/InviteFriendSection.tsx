'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Mail, Share2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface InviteFriendSectionProps {
    uniqueCode: string;
    referrals: any[]; // List of referrals if available, or just count
}

export function InviteFriendSection({ uniqueCode, referrals = [] }: InviteFriendSectionProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(uniqueCode);
        toast({ title: 'Copied!', description: 'Code copied to clipboard.' });
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Dicilo',
                    text: `Use my code ${uniqueCode} to join Dicilo and get 50 Dicipoints!`,
                    url: 'https://dicilo.net/registrieren'
                });
            } catch (err) {
                console.error(err);
            }
        } else {
            handleCopy();
        }
    };

    const handleSendEmail = () => {
        if (!email) return;

        // Simulating email send by opening mailto
        const subject = encodeURIComponent("Invitation to Dicilo Network");
        const body = encodeURIComponent(`Hi!\n\nI'd like to invite you to join Dicilo. Use my code *${uniqueCode}* when you register to get a Welcome Bonus of 50 Dicipoints!\n\nRegister here: https://dicilo.net/registrieren\n\nSee you there!`);

        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        setEmail('');
        toast({ title: 'Email Client Opened', description: 'Please send the email using your preferred client.' });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            {/* Hero Section */}
            <div className="rounded-2xl bg-gradient-to-r from-primary/90 to-primary p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-2xl font-bold">Invite Friends & Earn</h2>
                        <p className="opacity-90 max-w-md">
                            Get <strong>20 Dicipoints</strong> for every friend who joins using your code.
                            They get <strong>50 Dicipoints</strong> to start!
                        </p>
                    </div>
                    <div className="flex flex-col items-center bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                        <span className="text-xs uppercase tracking-wider opacity-75 mb-1">Your Unique Code</span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-mono font-bold tracking-widest">{uniqueCode}</span>
                            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={handleCopy}>
                                <Copy size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Email Invite Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail size={18} /> Send Invitation</CardTitle>
                        <CardDescription>We'll draft an email for you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Friend's Email Address</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="friend@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Button onClick={handleSendEmail}>
                                    Send
                                </Button>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or share via</span>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                            <Share2 size={16} /> Share Link
                        </Button>
                    </CardContent>
                </Card>

                {/* Referrals List aka "My Network" */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star size={18} /> My Referrals</CardTitle>
                        <CardDescription>Friends who joined with your code.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {referrals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground bg-secondary/20 rounded-lg">
                                <Users className="h-10 w-10 mb-2 opacity-20" size={32} />
                                <p>No referrals yet.</p>
                                <p className="text-xs">Share your code to start earning!</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[200px] overflow-auto">
                                {referrals.map((ref: any, i) => (
                                    <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                                {ref.code?.slice(0, 1) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">User {ref.code}</p>
                                                <p className="text-xs text-muted-foreground">Joined {new Date(ref.joinedAt || Date.now()).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">+20 DP</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Icon helper
function Users({ className, ...props }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
