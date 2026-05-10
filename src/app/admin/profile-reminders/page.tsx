'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshCw, Search, Send, LayoutDashboard, CheckCircle2, AlertCircle, Phone, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { sendManualProfileReminder } from '@/app/actions/admin-reminders';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const db = getFirestore(app);

interface ProfileData {
    id: string;
    clientName: string;
    email: string;
    phone: string;
    clientType: string;
    missingKeys: string[];
    lastSentAt: Date | null;
}

const checkMissingFields = (data: any) => {
    const missingKeys: string[] = [];
    if (!data.clientLogoUrl && !data.imageUrl) missingKeys.push('Logo');
    if (!data.phone) missingKeys.push('Teléfono');
    if (!data.address) missingKeys.push('Dirección');
    if (!data.zip) missingKeys.push('Código Postal');
    if (!data.city) missingKeys.push('Ciudad');
    if (!data.neighborhood) missingKeys.push('Barrio');
    if (!data.country) missingKeys.push('País');
    if (!data.website) missingKeys.push('Sitio Web');
    if (!data.mapUrl && !data.location) missingKeys.push('Ubicación (Mapa)');
    return missingKeys;
};

export default function ProfileRemindersPage() {
    useAuthGuard(['admin', 'superadmin', 'team_office'], 'access_admin_panel');
    const [profiles, setProfiles] = useState<ProfileData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    const fetchProfiles = async () => {
        setIsLoading(true);
        try {
            const businessesCol = collection(db, 'businesses');
            const q = query(businessesCol, where('clientType', 'in', ['basic', 'starter', 'premium']));
            const snapshot = await getDocs(q);

            const profileList: ProfileData[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                const lastSentAt = data.profileReminderLastSentAt 
                    ? (data.profileReminderLastSentAt as Timestamp).toDate() 
                    : null;
                
                return {
                    id: doc.id,
                    clientName: data.clientName || data.name || 'Sin Nombre',
                    email: data.email || '',
                    phone: data.phone || '',
                    clientType: data.clientType || 'basic',
                    missingKeys: checkMissingFields(data),
                    lastSentAt
                };
            });

            setProfiles(profileList);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los perfiles.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleSendReminder = async (businessId: string) => {
        setIsSending(businessId);
        try {
            const result = await sendManualProfileReminder(businessId);
            if (result.success) {
                toast({ title: 'Éxito', description: result.message });
                setProfiles((prev) => prev.map(p => 
                    p.id === businessId ? { ...p, lastSentAt: new Date() } : p
                ));
            } else {
                toast({ title: 'Aviso', description: result.message, variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSending(null);
        }
    };

    const filteredProfiles = useMemo(() => {
        return profiles.filter((p) =>
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [profiles, searchQuery]);

    const incompleteProfiles = filteredProfiles.filter(p => p.missingKeys.length > 0);
    const completeProfiles = filteredProfiles.filter(p => p.missingKeys.length === 0);

    const renderTable = (data: ProfileData[], isIncomplete: boolean) => (
        <div className="rounded-lg border bg-white dark:bg-slate-900 overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Empresa / Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono (WhatsApp)</TableHead>
                        <TableHead>Plan</TableHead>
                        {isIncomplete && <TableHead>Faltan</TableHead>}
                        <TableHead>Último Recordatorio</TableHead>
                        {isIncomplete && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((profile) => (
                            <TableRow key={profile.id}>
                                <TableCell className="font-medium">{profile.clientName}</TableCell>
                                <TableCell>{profile.email || <span className="text-muted-foreground italic">Sin correo</span>}</TableCell>
                                <TableCell>
                                    {profile.phone ? (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-green-500" />
                                            {profile.phone}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground flex items-center gap-1"><XCircle className="h-4 w-4" /> Faltante</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {profile.clientType}
                                    </Badge>
                                </TableCell>
                                {isIncomplete && (
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge variant="destructive" className="flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {profile.missingKeys.length} campos
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p className="font-semibold mb-1">Campos faltantes:</p>
                                                    <ul className="list-disc pl-4 text-xs">
                                                        {profile.missingKeys.map(k => <li key={k}>{k}</li>)}
                                                    </ul>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                )}
                                <TableCell>
                                    {profile.lastSentAt ? (
                                        <div className="text-sm">
                                            {profile.lastSentAt.toLocaleDateString()} <br/>
                                            <span className="text-xs text-muted-foreground">{profile.lastSentAt.toLocaleTimeString()}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground italic">Nunca</span>
                                    )}
                                </TableCell>
                                {isIncomplete && (
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            disabled={isSending === profile.id || !profile.email}
                                            onClick={() => handleSendReminder(profile.id)}
                                            variant="secondary"
                                        >
                                            {isSending === profile.id ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4 mr-2" />
                                            )}
                                            Enviar Ahora
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={isIncomplete ? 7 : 5} className="h-24 text-center">
                                No se encontraron perfiles.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="p-4 md:p-8 container mx-auto space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-primary" />
                        Seguimiento de Perfiles
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Monitorea qué usuarios tienen perfiles incompletos y envíales recordatorios.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <Button onClick={fetchProfiles} variant="outline" disabled={isLoading}>
                        <RefreshCw className={\`mr-2 h-4 w-4 \${isLoading ? 'animate-spin' : ''}\`} />
                        Recargar
                    </Button>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <Tabs defaultValue="incomplete" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="incomplete" className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            Incompletos ({incompleteProfiles.length})
                        </TabsTrigger>
                        <TabsTrigger value="complete" className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Completos ({completeProfiles.length})
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="incomplete">
                        {renderTable(incompleteProfiles, true)}
                    </TabsContent>
                    
                    <TabsContent value="complete">
                        {renderTable(completeProfiles, false)}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
