'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Trash2, Building2, Search, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Input } from '@/components/ui/input';

const db = getFirestore(app);

interface B2BProfile {
    id: string;
    companyName: string;
    plan: string;
    category: string;
    city: string;
    status: string;
    profileCompletionScore: number;
    migratedFromLegacy: boolean;
}

export default function B2BProfilesPage() {
    useAuthGuard(['admin', 'superadmin', 'team_office']);
    const [profiles, setProfiles] = useState<B2BProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'business_profiles'));
                const list = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as B2BProfile[];
                setProfiles(list);
            } catch (error) {
                console.error("Error fetching business_profiles:", error);
                toast({ title: "Error", description: "No se pudieron cargar los perfiles B2B.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfiles();
    }, [toast]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de querer eliminar este perfil B2B?')) return;
        try {
            await deleteDoc(doc(db, 'business_profiles', id));
            setProfiles(prev => prev.filter(p => p.id !== id));
            toast({ title: 'Eliminado', description: 'Perfil B2B eliminado correctamente.' });
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo eliminar el perfil.', variant: 'destructive' });
        }
    };

    const filteredProfiles = profiles.filter(p => 
        p.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.plan?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-8">
                <Skeleton className="h-10 w-1/3 mb-6" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="p-8 animate-in fade-in zoom-in duration-500">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Building2 className="w-8 h-8 text-primary" />
                        Base de Datos B2B (Nuevo Ecosistema)
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Lista oficial de empresas alojadas en la nueva colección independiente <code className="bg-slate-100 px-1 rounded">business_profiles</code>.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Volver al Dashboard
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="Buscar por nombre o plan..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Categoría / Ciudad</TableHead>
                            <TableHead>Score (Perfil)</TableHead>
                            <TableHead>Origen</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProfiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                    No se encontraron empresas en el nuevo ecosistema.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProfiles.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-semibold text-slate-800">
                                        {p.companyName || 'Sin Nombre'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="uppercase font-bold tracking-wider">
                                            {p.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        <div>{p.category || 'N/A'}</div>
                                        <div className="text-xs text-slate-400">{p.city || 'N/A'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${p.profileCompletionScore >= 85 ? 'bg-green-500' : 'bg-amber-500'}`} 
                                                    style={{ width: `${p.profileCompletionScore || 0}%` }} 
                                                />
                                            </div>
                                            <span className="text-xs font-medium">{p.profileCompletionScore || 0}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {p.migratedFromLegacy ? (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
                                                Migrado (Legacy)
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                                                Nuevo B2B
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(p.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
