'use client';

import { Activity, Flame, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

    const getLevelConfig = (level: string) => {
        switch (level) {
            case 'fire': return { color: 'text-red-500', bg: 'bg-red-500', icon: Flame, label: '¡ON FIRE! 🔥', description: 'El barrio está que arde' };
            case 'high': return { color: 'text-orange-500', bg: 'bg-orange-500', icon: Activity, label: 'Alta Actividad ⚡', description: 'Mucha participación reciente' };
            case 'medium': return { color: 'text-blue-500', bg: 'bg-blue-500', icon: TrendingUp, label: 'Crecimiento Constante 📈', description: 'El barrio se está moviendo' };
            default: return { color: 'text-green-500', bg: 'bg-green-500', icon: Users, label: 'Tranquilo 🌱', description: 'Ideal para empezar a publicar' };
        }
    };

    const config = getLevelConfig(activityLevel);
    const Icon = config.icon;

    return (
        <Card className="border-2 shadow-md relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${config.bg}`} />
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">Barómetro: <span className="font-bold">{neighborhoodName}</span></span>
                    <Icon className={`h-6 w-6 ${config.color}`} />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className={`text-2xl font-black ${config.color}`}>{config.label}</p>
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold">{score}</p>
                            <p className="text-xs text-muted-foreground uppercase">Índice</p>
                        </div>
                    </div>

                    <Progress value={score} className={`h-3 ${config.bg}/20`} indicatorClassName={config.bg} />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded p-3 text-center">
                            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{weeklyPostCount}</p>
                            <p className="text-xs text-muted-foreground">Posts esta semana</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded p-3 text-center">
                            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{activeUsersCount}</p>
                            <p className="text-xs text-muted-foreground">Vecinos activos</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
