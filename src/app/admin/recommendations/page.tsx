'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getFirestore, collection, query, getDocs, orderBy, deleteDoc, doc, updateDoc, addDoc, setDoc, where, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { sendProspectInvitation } from '@/app/actions/prospect-actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader2, Search, Trash2, LayoutDashboard, RefreshCw, Pen, UserPlus, CheckCircle, Mail, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ProspectValidationDialog } from '@/components/admin/ProspectValidationDialog';

const db = getFirestore(app);

export default function RecommendationsPage() {
    useAuthGuard();
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Edit State
    const [editingRec, setEditingRec] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // Convert State
    const [convertingRec, setConvertingRec] = useState<any | null>(null);
    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [targetType, setTargetType] = useState<string>('business'); // business, starter, retailer, premium

    // Filters State
    const [sortOrder, setSortOrder] = useState<string>('newest');
    const [filterCountry, setFilterCountry] = useState<string>('all');
    const [filterCity, setFilterCity] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const fetchRecommendations = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'recommendations'), orderBy('timestamp', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecommendations(data);
        } catch (error: any) {
            console.error('Error fetching recommendations:', error);
            toast({
                title: t('common:error', { ns: 'common' }) || 'Error',
                description: error.message || 'Error fetching data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await deleteDoc(doc(db, 'recommendations', id));
            toast({
                title: t('common:success', { ns: 'common' }) || 'Success',
                description: 'Record deleted successfully.',
            });
            setRecommendations(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
            toast({
                title: 'Error',
                description: 'Could not delete record.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(null);
        }
    };

    // --- Edit Logic ---
    const [recommenderDetails, setRecommenderDetails] = useState<{name: string, diciloCode: string} | null>(null);

    const handleEditClick = (rec: any) => {
        setEditingRec({ ...rec });
        setIsEditOpen(true);
    };

    useEffect(() => {
        if (editingRec?.userId) {
            getDoc(doc(db, 'private_profiles', editingRec.userId)).then(d => {
                if (d.exists()) {
                    const ud = d.data();
                    setRecommenderDetails({
                        name: ud.name || ud.first_name || editingRec.referrerName || 'Desconocido',
                        diciloCode: ud.diciloCode || editingRec.diciloCode || '-'
                    });
                } else {
                    setRecommenderDetails(null);
                }
            }).catch(console.error);
        } else {
            setRecommenderDetails(null);
        }
    }, [editingRec]);

        } finally {
            setIsSavingEdit(false);
        }
    };

    // Removed inline Verification, GenerateKey, SendInvitation handlers
    // as they are now handled by ProspectValidationDialog.

            setIsSendingEmail(false);
        }
    };

    // --- Convert Logic ---
    const handleConvertClick = (rec: any) => {
        setConvertingRec(rec);
        setTargetType('business'); // default
        setIsConvertOpen(true);
    };

    const handleConvert = async () => {
        if (!convertingRec) return;
        setIsConverting(true);
        try {
            // 1. Create Business
            // Generate basic business data
            const businessData = {
                name: convertingRec.companyName || 'Unknown',
                category: convertingRec.category || 'General',
                email: convertingRec.email || '',
                phone: convertingRec.phone || '',
                item_website: convertingRec.website || '', // Map to different fields if needed
                website: convertingRec.website || '',
                location: convertingRec.city ? `${convertingRec.city}, ${convertingRec.country || ''}` : (convertingRec.country || ''),
                address: convertingRec.city || '',
                description: convertingRec.comments || `Recommendation from ${convertingRec.contactName}`,
                active: true,
                createdAt: new Date(),
                source: 'recommendation',
                recommendationId: convertingRec.id
            };

            // Use addDoc to auto-generate ID, or custom ID?
            const businessRef = await addDoc(collection(db, 'businesses'), businessData);
            const businessId = businessRef.id;

            // 2. If Client Type selected (not just business), create Client Doc
            if (targetType !== 'business') {
                const clientData = {
                    businessId: businessId,
                    clientName: businessData.name,
                    clientType: targetType, // starter, retailer, premium
                    email: businessData.email,
                    phone: businessData.phone,
                    active: true,
                    createdAt: new Date(),
                    subscriptionStatus: 'active', // Default to active or trial?
                };

                // Create client with same ID as business for simplicity? Or new ID?
                // The promoteToClient function normally links them. 
                // Let's use a new doc in 'clients'
                await addDoc(collection(db, 'clients'), clientData);
            }

            toast({
                title: 'Conversion Successful',
                description: `Created Business (${targetType}).`
            });

            setIsConvertOpen(false);

            // Optional: Ask to delete recommendation?
            // For now, let's mark it as converted or just leave it.
            // Maybe add a tag "Converted"?
            try {
                await updateDoc(doc(db, 'recommendations', convertingRec.id), { converted: true, convertedTo: businessId });
                setRecommendations(prev => prev.map(r => r.id === convertingRec.id ? { ...r, converted: true } : r));
            } catch (e) {
                // Ignore if update fails, conversion succeeded
            }

        } catch (error: any) {
            console.error(error);
            toast({ title: 'Conversion Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsConverting(false);
        }
    };


    // Extract unique values
    const uniqueCities = useMemo(() => Array.from(new Set(recommendations.map(r => r.city).filter(Boolean))).sort(), [recommendations]);
    const uniqueCountries = useMemo(() => Array.from(new Set(recommendations.map(r => r.country).filter(Boolean))).sort(), [recommendations]);
    const uniqueCategories = useMemo(() => Array.from(new Set(recommendations.map(r => r.category).filter(Boolean))).sort(), [recommendations]);

    const filteredRecommendations = useMemo(() => {
        return recommendations.filter(rec => {
            const matchesSearch = (rec.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rec.email?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCountry = filterCountry === 'all' || rec.country === filterCountry;
            const matchesCity = filterCity === 'all' || rec.city === filterCity;
            const matchesCategory = filterCategory === 'all' || rec.category === filterCategory;

            return matchesSearch && matchesCountry && matchesCity && matchesCategory;
        }).sort((a, b) => {
            if (sortOrder === 'name-asc') return (a.companyName || '').localeCompare(b.companyName || '');
            if (sortOrder === 'name-desc') return (b.companyName || '').localeCompare(a.companyName || '');
            if (sortOrder === 'newest') {
                const dateA = a.timestamp?.seconds ? new Date(a.timestamp.seconds * 1000) : new Date(0);
                const dateB = b.timestamp?.seconds ? new Date(b.timestamp.seconds * 1000) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            }
            if (sortOrder === 'oldest') {
                const dateA = a.timestamp?.seconds ? new Date(a.timestamp.seconds * 1000) : new Date(0);
                const dateB = b.timestamp?.seconds ? new Date(b.timestamp.seconds * 1000) : new Date(0);
                return dateA.getTime() - dateB.getTime();
            }
            return 0;
        });
    }, [recommendations, searchTerm, sortOrder, filterCountry, filterCity, filterCategory]);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <main className="container mx-auto flex-grow p-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{t('recommendations.title')}</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                {t('businesses.backToDashboard')}
                            </Link>
                        </Button>
                        <Button onClick={fetchRecommendations} variant="outline" disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {t('businesses.reload')}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {t('recommendations.listTitle')}
                            <Badge variant="secondary" className="ml-2">
                                {filteredRecommendations.length}
                            </Badge>
                        </CardTitle>
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4 flex-wrap">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('recommendations.searchPlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 w-[250px]"
                                    />
                                </div>

                                {/* Sort */}
                                <Select value={sortOrder} onValueChange={setSortOrder}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                        <SelectItem value="oldest">Oldest First</SelectItem>
                                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Country Filter */}
                                <Select value={filterCountry} onValueChange={setFilterCountry}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Countries</SelectItem>
                                        {uniqueCountries.map(c => <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                {/* City Filter */}
                                <Select value={filterCity} onValueChange={setFilterCity}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="City" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cities</SelectItem>
                                        {uniqueCities.map(c => <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                {/* Category Filter */}
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {uniqueCategories.map(c => <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                {/* Reset */}
                                <Button variant="ghost" onClick={() => {
                                    setSearchTerm('');
                                    setSortOrder('newest');
                                    setFilterCountry('all');
                                    setFilterCity('all');
                                    setFilterCategory('all');
                                }}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Recomendador / ID</TableHead>
                                            <TableHead>{t('recommendations.table.company')}</TableHead>
                                            <TableHead>{t('recommendations.table.contact')}</TableHead>
                                            <TableHead>{t('recommendations.table.email')}</TableHead>
                                            <TableHead>{t('recommendations.table.category')}</TableHead>
                                            <TableHead>Idioma / Ubicación</TableHead>
                                            <TableHead>{t('recommendations.table.details')}</TableHead>
                                            <TableHead>{t('recommendations.table.status')}</TableHead>
                                            <TableHead>{t('recommendations.table.paymentStatus')}</TableHead>
                                            <TableHead className="text-right">{t('recommendations.table.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRecommendations.map((rec) => (
                                            <TableRow key={rec.id} className={rec.converted ? "bg-muted/50" : ""}>
                                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-medium">
                                                    {rec.timestamp?.seconds ? new Date(rec.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        <span className="font-semibold text-primary">{rec.referrerName && rec.referrerName !== 'Un usuario de Dicilo' ? rec.referrerName : (rec.contactName || 'Desconocido')}</span>
                                                        <span className="text-muted-foreground text-xs font-mono">{rec.diciloCode || rec.userId || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{rec.companyName}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        <span>{rec.contactName}</span>
                                                        <span className="text-muted-foreground text-xs">{rec.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{rec.email}</TableCell>
                                                <TableCell>{rec.category}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span title={`Idioma: ${rec.lang || 'No definido'}`} className="text-lg">
                                                                {rec.lang === 'es' ? '🇪🇸' : rec.lang === 'en' ? '🇬🇧' : rec.lang === 'de' ? '🇩🇪' : rec.lang === 'fr' ? '🇫🇷' : rec.lang === 'pt' ? '🇵🇹' : rec.lang === 'it' ? '🇮🇹' : '🌐'}
                                                            </span>
                                                            <span className="font-medium uppercase text-xs">{rec.lang || 'ES'}</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                            <span>{rec.city || 'Sin ciudad'}</span>{rec.country && <span>, {rec.country}</span>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <div className="truncate" title={rec.comments}>{rec.comments}</div>
                                                    {rec.website && <a href={rec.website} target="_blank" className="text-blue-500 text-xs hover:underline block truncate">{rec.website}</a>}
                                                </TableCell>
                                                <TableCell>
                                                    {rec.converted ? (
                                                        <Badge className="bg-green-500 text-white hover:bg-green-600 border-transparent"><CheckCircle className="w-3 h-3 mr-1" /> Convertido</Badge>
                                                    ) : rec.validationStatus === 'invitation_sent' ? (
                                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent">Invitación Enviada</Badge>
                                                    ) : rec.validationStatus === 'validated' ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-transparent">Datos Validados</Badge>
                                                    ) : rec.status === 'approved' ? (
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-transparent">Aprobado</Badge>
                                                    ) : (
                                                        <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent">Sin Revisar</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {rec.unsubscribed || rec.status === 'unsubscribed' ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 uppercase" title="La empresa indicó que no desea pertenecer a la plataforma">
                                                            Dado de Baja
                                                        </span>
                                                    ) : rec.pointsPaid ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Pago Completado
                                                        </span>
                                                    ) : (!rec.userId || rec.userId.trim() === '') ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase border border-slate-200" title="Recomendación pública sin cuenta asociada.">
                                                            N/A (Público)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap" title="Los DiciPoints se pagarán automáticamente en cuanto la empresa complete su registro en la plataforma.">
                                                            Bono en Espera (Al registrarse)
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="icon" variant="ghost" onClick={() => handleConvertClick(rec)} title={t('recommendations.actions.convert')}>
                                                            <UserPlus className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => handleEditClick(rec)} title={t('recommendations.actions.edit')}>
                                                            <Pen className="h-4 w-4" />
                                                        </Button>

                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={async () => {
                                                                const newStatus = rec.status === 'approved' ? 'pending' : 'approved';
                                                                try {
                                                                    await updateDoc(doc(db, 'recommendations', rec.id), { status: newStatus });
                                                                    setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, status: newStatus } : r));
                                                                    toast({ title: 'Status Updated', description: `Recommendation is now ${newStatus}.` });
                                                                } catch (error: any) {
                                                                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                                                                }
                                                            }}
                                                            title={rec.status === 'approved' ? "Suspend" : "Approve"}
                                                        >
                                                            {rec.status === 'approved' ? (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 text-gray-300" />
                                                            )}
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="hover:bg-destructive/10">
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>{t('recommendations.delete.title')}</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        {t('recommendations.delete.description')}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>{t('common:cancel', { ns: 'common' }) || 'Cancel'}</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(rec.id)}>{t('common:delete', { ns: 'common' }) || 'Delete'}</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Edit Dialog */}
            {/* Edit Dialog replaced with the new Reusable Component */}
            <ProspectValidationDialog
                prospect={editingRec}
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                onUpdate={(newRec) => setRecommendations(prev => prev.map(r => r.id === newRec.id ? newRec : r))}
            />

            {/* Convert Dialog */}
            <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Convert to Client</DialogTitle>
                        <DialogDescription>
                            Create a new Business and Client record from this recommendation?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label>Select Target Level</Label>
                        <Select value={targetType} onValueChange={setTargetType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="business">Business (List Only)</SelectItem>
                                <SelectItem value="starter">Client: Starter</SelectItem>
                                <SelectItem value="retailer">Client: Retailer</SelectItem>
                                <SelectItem value="premium">Client: Premium</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="text-sm text-muted-foreground">
                            {targetType === 'business' && t('recommendations.convert.businessHelp')}
                            {targetType === 'starter' && t('recommendations.convert.starterHelp')}
                            {targetType === 'retailer' && t('recommendations.convert.retailerHelp')}
                            {targetType === 'premium' && t('recommendations.convert.premiumHelp')}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConvertOpen(false)}>Cancel</Button>
                        <Button onClick={handleConvert} disabled={isConverting}>
                            {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Convert & Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
