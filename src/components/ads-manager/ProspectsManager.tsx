'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface Recommendation {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    city: string;
    timestamp?: any;
    pointsPaid?: boolean;
    converted?: boolean;
}

export function ProspectsManager({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [prospects, setProspects] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProspects = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const db = getFirestore(app);
            // Assuming Recommendations are stored in 'recommendations' root collection with 'userId' field
            // based on the admin tool I built earlier.
            // If they are in subcollection, I need to check that. 
            // The admin tool read from root 'recommendations'.

            const q = query(
                collection(db, 'recommendations'),
                where('userId', '==', user.uid),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Recommendation[];

            setProspects(data);
        } catch (error) {
            console.error("Error fetching prospects:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProspects();
    }, [user]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{t('adsManager.cards.programs.prospects.title')}</h1>
                    <p className="text-muted-foreground">{t('adsManager.cards.programs.prospects.description')}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Mis Prospectos Registrados</CardTitle>
                        <Button variant="outline" size="sm" onClick={fetchProspects} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                    <CardDescription>
                        Aquí puedes ver el estado de las empresas que has recomendado.
                        Ganas 10 DiciPoints cuando el sistema valida el prospecto.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : prospects.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No has registrado ningún prospecto aún.</p>
                            <p className="text-sm mt-2">¡Recomienda empresas y empieza a ganar!</p>
                            {/* TODO: Add button to open recommendation form */}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Empresa</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead>Ciudad</TableHead>
                                        <TableHead>Estado Pago</TableHead>
                                        <TableHead>Conversión</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prospects.map((prospect) => (
                                        <TableRow key={prospect.id}>
                                            <TableCell className="font-medium">{prospect.companyName}</TableCell>
                                            <TableCell>{prospect.contactName}</TableCell>
                                            <TableCell>{prospect.city}</TableCell>
                                            <TableCell>
                                                {prospect.pointsPaid ? (
                                                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Pagado (+10 DP)
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                                        <Clock className="w-3 h-3 mr-1" /> Pendiente
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {prospect.converted ? (
                                                    <span className="text-xs text-green-600 font-bold">¡Cliente Nuevo!</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
