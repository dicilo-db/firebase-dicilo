'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from './NotificationBell';

interface MobileHeaderProps {
    userData: any;
    currentView: string;
    onViewChange: (view: string) => void;
}

export function MobileHeader({ userData, currentView, onViewChange }: MobileHeaderProps) {
    const isFreelancerContext = currentView === 'freelancer';

    return (
        <header className="relative flex h-16 w-full items-center justify-between border-b bg-white px-4 shrink-0 z-20 md:hidden">
            {isFreelancerContext ? (
                // Freelancer Context Header
                <>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium pl-1 pr-3 py-1"
                        onClick={() => onViewChange('overview')}
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span>Volver</span>
                    </Button>
                    
                    <h1 className="text-base font-bold text-slate-900 absolute left-1/2 -translate-x-1/2">
                        Freelancer
                    </h1>

                    <Avatar className="h-9 w-9 border border-slate-200">
                        <AvatarImage src={userData?.photoURL || userData?.photoUrl} />
                        <AvatarFallback>{userData?.firstName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                </>
            ) : (
                // General Context Header
                <>
                    <div className="flex items-center">
                        <Image
                            src="/logo.png"
                            alt="Dicilo Logo"
                            width={110}
                            height={28}
                            className="h-7 w-auto object-contain"
                            priority
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        
                        <Avatar className="h-9 w-9 border border-slate-200">
                            <AvatarImage src={userData?.photoURL || userData?.photoUrl} />
                            <AvatarFallback>{userData?.firstName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                    </div>
                </>
            )}
        </header>
    );
}
