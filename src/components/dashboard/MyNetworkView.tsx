'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Network, Users, Trophy, Star, Medal } from 'lucide-react';
import { getNetworkTree } from '@/app/actions/mlm-actions';
import { useTranslation } from 'react-i18next';

interface MyNetworkViewProps {
    uid: string;
}

export function MyNetworkView({ uid }: MyNetworkViewProps) {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(true);
    const [treeNode, setTreeNode] = useState<any>(null);

    useEffect(() => {
        const loadNetwork = async () => {
            setLoading(true);
            try {
                // Fetch up to 3 or 4 levels deep for the user
                const data = await getNetworkTree(uid, 3);
                setTreeNode(data);
            } catch (error) {
                console.error(error);
            }
            setLoading(false);
        };
        
        if (uid) {
            loadNetwork();
        }
    }, [uid]);

    const RankIcon = ({ role }: { role: string }) => {
        if (role === 'team_leader') return <Trophy className="text-amber-500 w-5 h-5" />;
        if (role === 'freelancer') return <Star className="text-blue-500 w-5 h-5" />;
        return <Medal className="text-slate-400 w-5 h-5" />;
    };

    const renderTree = (node: any, depth = 0) => {
        if (!node) return null;
        return (
            <div key={node.uid} className={`ml-${depth * 6} mt-2 p-3 border-l-2 ${depth === 0 ? 'border-primary' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-900 rounded-r-md shadow-sm`}>
                <div className="flex items-center gap-3">
                    <RankIcon role={node.role} />
                    <div>
                        <p className="font-semibold text-sm">
                            {depth === 0 ? "¡Tú!" : `${node.firstName} ${node.lastName}`} 
                            <span className="text-xs text-muted-foreground ml-2">({node.role})</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {depth > 0 && `${node.email} | `}
                            Directos: {node.directsCount}
                        </p>
                    </div>
                </div>
                {node.directs && node.directs.length > 0 && (
                    <div className="mt-2 ml-4">
                        {node.directs.map((child: any) => renderTree(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Network className="h-8 w-8 text-orange-500" />
                <div>
                    <h1 className="text-2xl font-bold">Mi Red Dicilo</h1>
                    <p className="text-muted-foreground">Visualiza tu árbol de invitados y equipo.</p>
                </div>
            </div>

            <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-500" />
                        Tu Estructura Directa
                    </CardTitle>
                    <CardDescription>
                        Aquí podrás ver la evolución de tu equipo. Invita a más personas y guíalos para crecer tu red y tus ganancias.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto pb-6">
                        {treeNode && treeNode.directsCount === 0 ? (
                            <div className="text-center py-10 bg-white rounded-lg border border-dashed">
                                <p className="text-muted-foreground mb-4">Todavía no has invitado a nadie a tu red.</p>
                            </div>
                        ) : (
                            renderTree(treeNode)
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
