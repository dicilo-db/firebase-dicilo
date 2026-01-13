'use client';

import { Activity, Flame, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface BarometerVisualProps {
    neighborhoodName: string;
    activityLevel: 'low' | 'medium' | 'high' | 'fire';
    score: number; // 0-100
    weeklyPostCount: number;
    activeUsersCount: number;
}

export function BarometerVisual({
    neighborhoodName,
    activityLevel,
    score,
    weeklyPostCount,
    activeUsersCount
}: BarometerVisualProps) {
    const { t } = useTranslation('common');

    const getLevelConfig = (level: string) => {
        switch (level) {
            case 'fire': return {
                color: 'text-red-500',
                bg: 'bg-red-50',
                border: 'border-red-100',
                icon: Flame,
                label: t('community.barometer.level.fire', '¡ON FIRE!'),
            };
            case 'high': return {
                color: 'text-orange-500',
                bg: 'bg-orange-50',
                border: 'border-orange-100',
                icon: Activity,
                label: t('community.barometer.level.high', 'Alta Actividad'),
            };
            case 'medium': return {
                color: 'text-blue-500',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                icon: TrendingUp,
                label: t('community.barometer.level.medium', 'Creciendo'),
            };
            default: return {
                color: 'text-green-500',
                bg: 'bg-green-50',
                border: 'border-green-100',
                icon: Users,
                label: t('community.barometer.level.low', 'Tranquilo'),
            };
        }
    };

    const config = getLevelConfig(activityLevel);
    const Icon = config.icon;

    // Calculate ring stroke (circumference = 2 * PI * r)
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <Card className={`border shadow-sm overflow-hidden bg-white dark:bg-slate-900 transition-all hover:shadow-md ${config.border}`}>
            <CardContent className="p-4 flex items-center justify-between gap-4">

                {/* Left: Label & Score Ring */}
                <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 flex items-center justify-center">
                        {/* Background Circle */}
                        <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 44 44">
                            <circle
                                className="text-slate-100 dark:text-slate-800"
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="22"
                                cy="22"
                            />
                            {/* Progress Circle */}
                            <circle
                                className={`${config.color} transition-all duration-1000 ease-out`}
                                strokeWidth="4"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="22"
                                cy="22"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-xs font-bold ${config.color}`}>{score}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('community.barometer.title', 'Barómetro')}</p>
                        <div className="flex items-center gap-1.5">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span className={`font-bold text-sm ${config.color}`}>{config.label}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Stats (Compact) */}
                <div className="flex items-center divide-x divide-slate-100 dark:divide-slate-800">
                    <div className="px-4 text-center">
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{weeklyPostCount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase mt-1">{t('community.barometer.posts', 'Posts')}</p>
                    </div>
                    <div className="px-4 text-center">
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{activeUsersCount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase mt-1">{t('community.barometer.neighbors', 'Vecinos')}</p>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
