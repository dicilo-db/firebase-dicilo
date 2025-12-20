'use client';

import React, { useEffect, useState } from 'react';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    addDoc,
    serverTimestamp,
    deleteDoc,
    doc,
    updateDoc,
    getFirestore,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import AdsCalculator from './AdsCalculator';

const db = getFirestore(app);
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, ExternalLink, ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import AdsForm from './AdsForm';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface AdBanner {
    id: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
    active: boolean;
    position: 'directory' | 'sidebar' | 'home';
    createdAt?: any;
    views?: number;
    clicks?: number;
    shares?: number;
    totalCost?: number;
    clientId?: string;
}

export default function AdsManagerPage() {
    const [ads, setAds] = useState<AdBanner[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAd, setEditingAd] = useState<AdBanner | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        // Robust fetch: Fetch all and sort client-side to avoid "Index Missing" errors
        // preventing the list from showing.
        const q = collection(db, 'ads_banners');

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const adsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as AdBanner[];

            // Sort client-side by createdAt (newest first)
            adsData.sort((a, b) => {
                const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return dateB - dateA;
            });
            setAds(adsData);
        }, (error) => {
            console.error("Error fetching ads:", error);
            toast({
                title: "Error loading ads",
                description: "Could not load the banners list.",
                variant: 'destructive',
            });
        });

        return () => unsubscribe();
    }, [toast]);

    const handleSaveAd = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (editingAd) {
                await updateDoc(doc(db, 'ads_banners', editingAd.id), {
                    ...data,
                    // Don't update createdAt
                });
                toast({ title: 'Success', description: 'Banner updated successfully.' });
            } else {
                await addDoc(collection(db, 'ads_banners'), {
                    ...data,
                    createdAt: serverTimestamp(),
                    views: 0,
                    clicks: 0,
                    shares: 0,
                    totalCost: 0
                });
                toast({ title: 'Success', description: 'Banner created successfully.' });
            }
            setIsDialogOpen(false);
            setEditingAd(null);
        } catch (error) {
            console.error('Error saving ad:', error);
            toast({
                title: 'Error',
                description: 'Failed to save banner.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        try {
            await deleteDoc(doc(db, 'ads_banners', id));
            toast({ title: 'Deleted', description: 'Banner deleted.' });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete banner.',
                variant: 'destructive',
            });
        }
    };

    const handleEditClick = (ad: AdBanner) => {
        setEditingAd(ad);
        setIsDialogOpen(true);
    };

    const handleCreateClick = () => {
        setEditingAd(null);
        setIsDialogOpen(true);
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'ads_banners', id), { active: !currentStatus });
        } catch (error) {
            console.error('Error toggling status', error);
        }
    };

    const handleExport = () => {
        const headers = ['ID', 'Title', 'Client', 'Position', 'Views', 'Clicks', 'Shares', 'Total Cost (EUR)', 'Active', 'Link'];
        const rows = ads.map(ad => {
            // Always calculate cost from counts to ensure consistency with displayed stats
            const cost = ((ad.clicks || 0) + (ad.shares || 0)) * 0.05;

            return [
                ad.id,
                `"${ad.title.replace(/"/g, '""')}"`, // Escape quotes
                ad.clientId || 'N/A',
                ad.position,
                ad.views || 0,
                ad.clicks || 0,
                ad.shares || 0,
                cost.toFixed(2),
                ad.active ? 'Yes' : 'No',
                ad.linkUrl
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join("\n");
        // Use Blob for better mobile compatibility
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "ads_statistics.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ads Manager</h1>
                        <p className="text-muted-foreground">
                            Manage your advertising banners and track performance (0.05€ / click or share).
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                        <AdsCalculator />
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) setEditingAd(null);
                        }}>
                            <DialogTrigger asChild>
                                <Button onClick={handleCreateClick}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Banner
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>{editingAd ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
                                    <DialogDescription>
                                        {editingAd ? 'Update the details of your banner.' : 'Upload a banner image, set the target link, and assign a client.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <AdsForm
                                    onSubmit={handleSaveAd}
                                    isSubmitting={isSubmitting}
                                    initialData={editingAd}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ads.map((ad) => {
                    // Always calculate cost from counts to ensure consistency with displayed stats
                    const cost = ((ad.clicks || 0) + (ad.shares || 0)) * 0.05;

                    return (
                        <Card key={ad.id} className="overflow-hidden flex flex-col">
                            <div className="relative h-40 w-full bg-gray-100">
                                {ad.imageUrl ? (
                                    <Image
                                        src={ad.imageUrl}
                                        alt={ad.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute right-2 top-2 flex gap-2">
                                    <Badge variant={ad.active ? 'default' : 'secondary'}>
                                        {ad.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Badge variant="outline" className="bg-white">
                                        {ad.position}
                                    </Badge>
                                </div>
                            </div>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-lg">{ad.title}</CardTitle>
                                {ad.clientId && (
                                    <p className="text-xs text-muted-foreground mb-1">ID: {ad.clientId}</p>
                                )}
                                <CardDescription className="truncate">
                                    <a
                                        href={ad.linkUrl}
                                        target="_blank"
                                        onClick={async () => {
                                            try {
                                                await fetch('/api/ads/click', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        adId: ad.id,
                                                        clientId: ad.clientId,
                                                        path: '/admin/ads-manager',
                                                        device: 'desktop'
                                                    }),
                                                });
                                            } catch (e) {
                                                console.error("Tracking error", e);
                                            }
                                        }}
                                        className="flex items-center hover:underline"
                                    >
                                        {ad.linkUrl} <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end">
                                <div className="grid grid-cols-4 gap-2 mt-4 text-center text-sm border-t pt-4">
                                    <div>
                                        <div className="font-bold">{ad.views || 0}</div>
                                        <div className="text-xs text-muted-foreground">Views</div>
                                    </div>
                                    <div>
                                        <div className="font-bold">{ad.clicks || 0}</div>
                                        <div className="text-xs text-muted-foreground">Clicks</div>
                                    </div>
                                    <div>
                                        <div className="font-bold">{ad.shares || 0}</div>
                                        <div className="text-xs text-muted-foreground">Envio</div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-green-600">
                                            {cost.toFixed(2)}€
                                        </div>
                                        <div className="text-xs text-muted-foreground">Cost</div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between pt-2 border-t border-dashed">
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={ad.active} onCheckedChange={() => toggleActive(ad.id, ad.active)} />
                                        <span className="text-xs text-muted-foreground">Visible</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditClick(ad)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => handleDeleteAd(ad.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {ads.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        No banners found. Click "Add Banner" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
