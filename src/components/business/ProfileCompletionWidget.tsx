'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProfileCompletionWidgetProps {
    score: number;
}

export function ProfileCompletionWidget({ score }: ProfileCompletionWidgetProps) {
    // Rules:
    // < 75 = PENDIENTE (Red/Orange)
    // 75 - 84 = EN REVISIÓN (Yellow/Blue)
    // >= 85 = ACTIVO Y PUBLICABLE (Green)

    let statusText = 'PENDIENTE';
    let statusColor = 'text-orange-500';
    let progressColor = 'bg-orange-500';

    if (score >= 85) {
        statusText = 'ACTIVO Y PUBLICABLE';
        statusColor = 'text-green-600';
        progressColor = 'bg-green-600';
    } else if (score >= 75) {
        statusText = 'EN REVISIÓN';
        statusColor = 'text-blue-500';
        progressColor = 'bg-blue-500';
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative flex items-center justify-center">
                {/* Simple circular progress visualization using SVG */}
                <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-slate-100 dark:text-slate-800"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 56}
                        strokeDashoffset={2 * Math.PI * 56 * (1 - score / 100)}
                        className={`${statusColor} transition-all duration-1000 ease-out`}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{score}%</span>
                </div>
            </div>
            
            <div className="text-center space-y-1">
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Estado de Landing</p>
                <p className={`font-bold ${statusColor}`}>{statusText}</p>
            </div>
            
            {score < 85 && (
                <p className="text-xs text-slate-500 text-center max-w-[200px]">
                    Necesitas alcanzar al menos un 85% para activar tu Landing Page pública.
                </p>
            )}
        </div>
    );
}
