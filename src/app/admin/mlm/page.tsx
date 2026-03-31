'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Loader2, ArrowLeft, Network, Trophy, Medal, Star } from 'lucide-react';
import { getMlmLeaders, getNetworkTree } from '@/app/actions/mlm-actions';

interface Leader {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    uniqueCode: string;
    role: string;
    directsCount: number;
    createdAt: string;
}

export default function AdminMLMPage() {
    useAuthGuard(['admin', 'superadmin'], 'access_admin_panel');
    const router = useRouter();

    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUid, setSelectedUid] = useState<string | null>(null);
    const [treeLoading, setTreeLoading] = useState(false);
    const [treeNode, setTreeNode] = useState<any>(null);

    useEffect(() => {
        loadLeaders();
    }, []);

    const loadLeaders = async () => {
        setLoading(true);
        try {
            const result = await getMlmLeaders();
            setLeaders(result);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleViewTree = async (uid: string) => {
        setSelectedUid(uid);
        setTreeLoading(true);
        try {
            const data = await getNetworkTree(uid, 3);
            setTreeNode(data);
        } catch (error) {
            console.error(error);
        }
        setTreeLoading(false);
    };

    const RankIcon = ({ role }: { role: string }) => {
        if (role === 'team_leader') return <Trophy className="text-amber-500 w-5 h-5" />;
        if (role === 'freelancer') return <Star className="text-blue-500 w-5 h-5" />;
        return <Medal className="text-slate-400 w-5 h-5" />;
    };

    const renderTree = (node: any, depth = 0) => {
        if (!node) return null;
        return (
            <div key={node.uid} className={`ml-${depth * 6} mt-2 p-3 border-l-2 ${depth === 0 ? 'border-primary' : 'border-slate-300 dark:border-slate-700'} bg-slate-50 dark:bg-slate-900 rounded-r-md shadow-sm`}>
                <div className="flex items-center gap-3">
                    <RankIcon role={node.role} />
                    <div>
                        <p className="font-semibold text-sm">
                            {node.firstName} {node.lastName} <span className="text-xs text-muted-foreground ml-2">({node.role})</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{node.email} | Directs: {node.directsCount}</p>
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
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin/dashboard')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Network className="h-8 w-8 text-orange-500" />
                        Red MLM: Control de Líderes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Visualiza de manera aristocrática la cadena de Freelancers y Team Leaders para futuros servicios y comisiones.
                    </p>
                </div>
            </div>

            {selectedUid ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Árbol de Red (Profundidad Máxima: Nivel 3)</CardTitle>
                            <CardDescription>Jerarquía directa de invitados</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setSelectedUid(null)}>
                            Cerrar Árbol
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {treeLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto pb-4">
                                {renderTree(treeNode)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Rangos Altos (Team Leaders y Freelancers)</CardTitle>
                        <CardDescription>Usuarios que han cumplido las metas de referidos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Líder</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rango</TableHead>
                                        <TableHead>Directos</TableHead>
                                        <TableHead>Código ID</TableHead>
                                        <TableHead className="text-right">Red</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No hay Team Leaders ni Freelancers registrados todavía.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        leaders.map((leader) => (
                                            <TableRow key={leader.uid}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <RankIcon role={leader.role} />
                                                        {leader.firstName} {leader.lastName}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{leader.email}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                        ${leader.role === 'team_leader' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}
                                                    `}>
                                                        {leader.role === 'team_leader' ? 'Team Leader' : 'Freelancer'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{leader.directsCount}</TableCell>
                                                <TableCell><code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{leader.uniqueCode}</code></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewTree(leader.uid)}>
                                                        Ver Árbol
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
