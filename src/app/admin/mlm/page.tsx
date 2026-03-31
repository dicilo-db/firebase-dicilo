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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Network, Trophy, Medal, Star, Save } from 'lucide-react';
import { getMlmLeaders, getNetworkTree } from '@/app/actions/mlm-actions';
import { getMLMSettings, saveMLMSettings, MLMSettings } from '@/app/actions/mlm-settings';

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

    const { toast } = useToast();

    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [treeLoading, setTreeLoading] = useState(false);
    const [treeNode, setTreeNode] = useState<any>(null);

    const [settings, setSettings] = useState<MLMSettings | null>(null);
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [leadersResult, settingsResult] = await Promise.all([
                getMlmLeaders(),
                getMLMSettings()
            ]);
            setLeaders(leadersResult);
            setSettings(settingsResult);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        setSavingSettings(true);
        const res = await saveMLMSettings(settings);
        if (res.success) {
            toast({ title: 'Configuración guardada', description: 'Los parámetros de comisiones se actualizaron correctamente.' });
        } else {
            toast({ title: 'Error', description: res.error, variant: 'destructive' });
        }
        setSavingSettings(false);
    };

    const handleViewTree = async (uid: string) => {
        setIsDialogOpen(true);
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
                        Red Dicilo: Control de Líderes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Visualiza de manera aristocrática la cadena de Freelancers y Team Leaders para futuros servicios y comisiones.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="leaders" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="leaders">Ranking de Líderes</TabsTrigger>
                    <TabsTrigger value="settings">Configuración Comisiones</TabsTrigger>
                </TabsList>

                <TabsContent value="leaders">
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
            </TabsContent>

            <TabsContent value="settings">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración Global de Comisiones</CardTitle>
                        <CardDescription>Establece los porcentajes y bonos del sistema Red Dicilo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-xl">
                        {settings && (
                            <>
                                <div className="space-y-2">
                                    <Label>Comisión Nivel 1 (Directos) %</Label>
                                    <Input 
                                        type="number" 
                                        value={settings.level1Percentage} 
                                        onChange={(e) => setSettings({ ...settings, level1Percentage: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Comisión Nivel 2 (Indirectos directos) %</Label>
                                    <Input 
                                        type="number" 
                                        value={settings.level2Percentage} 
                                        onChange={(e) => setSettings({ ...settings, level2Percentage: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Comisión Nivel 3 (Profundidad) %</Label>
                                    <Input 
                                        type="number" 
                                        value={settings.level3Percentage} 
                                        onChange={(e) => setSettings({ ...settings, level3Percentage: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2 pt-4 border-t">
                                    <Label>Bono Estacional (Fijo DiciCoins o EUR)</Label>
                                    <Input 
                                        type="number" 
                                        value={settings.seasonBonusAmount} 
                                        onChange={(e) => setSettings({ ...settings, seasonBonusAmount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Multiplicador de Temporada (ej. 1.5x)</Label>
                                    <Input 
                                        type="number" step="0.1" 
                                        value={settings.seasonMultiplier} 
                                        onChange={(e) => setSettings({ ...settings, seasonMultiplier: Number(e.target.value) })}
                                    />
                                </div>

                                <Button onClick={handleSaveSettings} disabled={savingSettings} className="mt-4">
                                    {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Guardar Configuración
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Árbol de Red (Profundidad Máxima: Nivel 3)</DialogTitle>
                        <DialogDescription>Jerarquía directa de invitados</DialogDescription>
                    </DialogHeader>
                    {treeLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto pb-4">
                            {renderTree(treeNode)}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
