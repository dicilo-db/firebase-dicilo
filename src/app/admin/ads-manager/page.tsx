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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash2, ExternalLink } from 'lucide-react';
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

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ads Manager</h1>
                    <p className="text-muted-foreground">
                        Manage your advertising banners and their positions.
                    </p>
                </div>
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
                                Upload a banner image and set the target link.
                            </DialogDescription>
                        </DialogHeader>
                        <AdsForm onSubmit={handleCreateAd} isSubmitting={isSubmitting} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ads.map((ad) => (
                    <Card key={ad.id} className="overflow-hidden">
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
                        <CardContent className="p-4 pt-0">
                            <div className="mt-4 flex items-center justify-between">
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
