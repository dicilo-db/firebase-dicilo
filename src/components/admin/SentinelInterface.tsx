'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

export function SentinelInterface() {
    const [synthesis, setSynthesis] = useState<string | null>(null);
    const [mermaidCode, setMermaidCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkSentinel = async () => {
        setLoading(true);
        setError(null);
        try {
            const auth = getAuth(app);
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No estás autenticado.');
            }
            
            const token = await user.getIdToken();
            
            const res = await fetch('/api/sentinel', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch Sentinel data');
            }
            const data = await res.json();
            setSynthesis(data.synthesis);
            setMermaidCode(data.mermaidMap);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mt-8 border-dashed border-red-500/50 bg-slate-50 dark:bg-slate-900/50">
            <CardHeader>
                <CardTitle className="text-red-500 flex items-center gap-2">
                    🛡️ Antigravity Sentinel
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Interfaz de Observabilidad Interna. Solo visible para Administradores.
                </p>
                <Button 
                    onClick={checkSentinel} 
                    disabled={loading}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                >
                    {loading ? 'Consultando...' : '¿Qué hay de nuevo en esta página?'}
                </Button>

                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {synthesis && (
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-md text-sm whitespace-pre-wrap border font-mono">
                        {synthesis}
                    </div>
                )}

                {mermaidCode && (
                    <div className="mt-4">
                        <h4 className="text-sm font-bold mb-2">Mermaid.js Structural Map:</h4>
                        <pre className="p-4 bg-slate-900 text-slate-300 rounded-md text-xs overflow-x-auto">
                            {mermaidCode}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
