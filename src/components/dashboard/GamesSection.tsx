'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Clock, Lock, Play, Gamepad2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { addGameReward } from '@/app/actions/game-rewards';
import { toast } from '@/hooks/use-toast';

type Difficulty = 'Fácil' | 'Medio' | 'Difícil';

interface Game {
    id: string;
    title: string;
    description: string;
    icon: string;
    dp: string;
    duration: string;
    difficulty: Difficulty;
    file: string;
    available: boolean;
}

const GAMES: Game[] = [
    {
        id: 'llenando-el-vaso',
        title: 'Llenando el Vaso',
        description: 'Persigue el vaso en movimiento y llénalo con el color correcto antes de que se acabe el tiempo.',
        icon: '💧',
        dp: '100 DP',
        duration: '120 seg',
        difficulty: 'Medio',
        file: '/games/llenando-el-vaso.html',
        available: true,
    },
    {
        id: 'cara-o-sello',
        title: 'Cara o Sello',
        description: 'Lanza la moneda Dicilo y acumula puntos con cada acierto.',
        icon: '🪙',
        dp: '50 DP',
        duration: '60 seg',
        difficulty: 'Fácil',
        file: '/games/cara-o-sello.html',
        available: false,
    },
    {
        id: 'atrapa-la-mosca',
        title: 'Atrapa la Mosca',
        description: 'Aplasta las moscas en las zonas de sponsor y acumula DC Points.',
        icon: '🪰',
        dp: '500 DP',
        duration: '120 seg',
        difficulty: 'Difícil',
        file: '/games/atrapa-la-mosca.html',
        available: false,
    },
];

const difficultyClass: Record<Difficulty, string> = {
    'Fácil':   'bg-emerald-950/60 text-emerald-400 border-emerald-800',
    'Medio':   'bg-blue-950/60   text-blue-400   border-blue-800',
    'Difícil': 'bg-rose-950/60   text-rose-400   border-rose-800',
};

export function GamesSection() {
    const [activeGame, setActiveGame] = useState<Game | null>(null);

    if (activeGame) {
        return <GamePlayer game={activeGame} onBack={() => setActiveGame(null)} />;
    }


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                    <Gamepad2 className="h-7 w-7 text-purple-600" />
                    Juegos
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Juega, acumula <strong className="text-slate-700">DC Points</strong> y canjéalos en la plataforma.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {GAMES.map(game => (
                    <GameCard key={game.id} game={game} onPlay={() => setActiveGame(game)} />
                ))}
            </div>
        </div>
    );
}

function GameCard({ game, onPlay }: { game: Game; onPlay: () => void }) {
    return (
        <div className={[
            'relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-200',
            'bg-slate-900 border-slate-700/60',
            game.available
                ? 'hover:border-purple-500/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-900/20'
                : 'opacity-60',
        ].join(' ')}>
            {!game.available && (
                <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    <Lock className="h-2.5 w-2.5" /> Próximamente
                </span>
            )}

            <span className="text-4xl leading-none">{game.icon}</span>

            <div>
                <h2 className="text-base font-bold text-slate-100">{game.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{game.description}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-yellow-400">
                    <Trophy className="h-3 w-3" /> {game.dp}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                    <Clock className="h-3 w-3" /> {game.duration}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${difficultyClass[game.difficulty]}`}>
                    {game.difficulty}
                </span>
            </div>

            <button
                onClick={() => game.available && onPlay()}
                disabled={!game.available}
                className={[
                    'mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-150',
                    game.available
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 active:scale-95'
                        : 'cursor-not-allowed bg-slate-800 text-slate-500',
                ].join(' ')}
            >
                {game.available
                    ? <><Play className="h-4 w-4 fill-white" /> Jugar</>
                    : <><Lock className="h-4 w-4" /> Próximamente</>
                }
            </button>
        </div>
    );
}

function GamePlayer({ game, onBack }: { game: Game; onBack: () => void }) {
    const { user } = useAuth();
    const [rewarded, setRewarded] = useState(false);
    const rewardedRef = useRef(false);

    useEffect(() => {
        const handler = async (e: MessageEvent) => {
            if (
                e.data?.type === 'DICILO_GAME_RESULT' &&
                e.data?.game === game.id &&
                e.data?.dp > 0 &&
                !rewardedRef.current
            ) {
                rewardedRef.current = true;
                setRewarded(true);
                if (user?.uid) {
                    const res = await addGameReward(user.uid, e.data.dp, game.title);
                    if (res.success) {
                        toast({
                            title: `🏆 +${e.data.dp} DP añadidos`,
                            description: `Tu wallet ha sido actualizada con los puntos de "${game.title}".`,
                        });
                    }
                }
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [game, user]);

    return (
        <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="shrink-0 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Volver
                </Button>
                <span className="flex-1 truncate font-bold text-slate-100">
                    {game.icon} {game.title}
                </span>
                {rewarded ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> +100 DP
                    </span>
                ) : (
                    <span className="shrink-0 text-xs font-bold text-yellow-400">
                        🏆 10 vasos = {game.dp}
                    </span>
                )}
            </div>

            <iframe
                src={game.file}
                title={game.title}
                className="w-full flex-1 border-none"
                style={{ minHeight: 'calc(100vh - 120px)' }}
                allow="fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms"
            />
        </div>
    );
}
