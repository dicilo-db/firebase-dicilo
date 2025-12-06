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
import { Plus, Trash2, ExternalLink, ArrowLeft } from 'lucide-react';
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
    totalCost?: number;
    clientId?: string;
}

export default function AdsManagerPage() {
    const [ads, setAds] = useState<AdBanner[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, 'ads_banners'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const adsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as AdBanner[];
            setAds(adsData);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateAd = async (data: any) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'ads_banners'), {
                ...data,
                createdAt: serverTimestamp(),
                views: 0,
                clicks: 0,
            });
            toast({ title: 'Success', description: 'Banner created successfully.' });
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error creating ad:', error);
            toast({
                title: 'Error',
                description: 'Failed to create banner.',
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

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'ads_banners', id), { active: !currentStatus });
        } catch (error) {
            console.error('Error toggling status', error);
        }
    };

    const handleExport = () => {
        const headers = ['ID', 'Title', 'Client', 'Position', 'Views', 'Clicks', 'Total Cost (EUR)', 'Active', 'Link'];
        const rows = ads.map(ad => {
            const cost = ad.totalCost || ((ad.clicks || 0) * 0.05);
            return [
                ad.id,
                `"${ad.title.replace(/"/g, '""')}"`, // Escape quotes
                ad.clientId || 'N/A',
                ad.position,
                ad.views || 0,
                ad.clicks || 0,
                cost.toFixed(2),
                ad.active ? 'Yes' : 'No',
                ad.linkUrl
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ads_statistics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                            Manage your advertising banners and track performance (0.05€ / click).
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Add Banner
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Create New Banner</DialogTitle>
                                    <DialogDescription>
                                        Upload a banner image, set the target link, and assign a client.
                                    </DialogDescription>
                                </DialogHeader>
                                <AdsForm onSubmit={handleCreateAd} isSubmitting={isSubmitting} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ads.map((ad) => (
                    <Card key={ad.id} className="overflow-hidden flex flex-col">
                        <div className="relative h-40 w-full bg-gray-100">
                            <Image
                                src={ad.imageUrl}
                                alt={ad.title}
                                fill
                                className="object-cover"
                            />
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
                            <CardDescription className="truncate">
                                <a
                                    href={ad.linkUrl}
                                    target="_blank"
                                    className="flex items-center hover:underline"
                                >
                                    {ad.linkUrl} <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end">
                            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm border-t pt-4">
                                <div>
                                    <div className="font-bold">{ad.views || 0}</div>
                                    <div className="text-xs text-muted-foreground">Views</div>
                                </div>
                                <div>
                                    <div className="font-bold">{ad.clicks || 0}</div>
                                    <div className="text-xs text-muted-foreground">Clicks</div>
                                </div>
                                <div>
                                    <div className="font-bold text-green-600">
                                        {(ad.totalCost || ((ad.clicks || 0) * 0.05)).toFixed(2)}€
                                    </div>
                                    <div className="text-xs text-muted-foreground">Cost</div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between pt-2 border-t border-dashed">
                                <div className="flex items-center space-x-2">
                                    <Switch checked={ad.active} onCheckedChange={() => toggleActive(ad.id, ad.active)} />
                                    <span className="text-xs text-muted-foreground">Visible</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteAd(ad.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {ads.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        No banners found. Click "Add Banner" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
