'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { collection, getDocs, getFirestore, query, orderBy } from 'firebase/firestore';

interface ClientOption {
    id: string;
    name: string;
}

const adSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    imageUrl: z.string().url('Image is required'),
    linkUrl: z.string().url('Target link is required'),
    active: z.boolean().default(true),
    position: z.enum(['directory', 'sidebar', 'home']).default('directory'),
    clientId: z.string().min(1, 'Client is required for billing'),
});

type AdFormData = z.infer<typeof adSchema>;

interface AdsFormProps {
    initialData?: any;
    onSubmit: (data: AdFormData) => Promise<void>;
    isSubmitting: boolean;
}

export default function AdsForm({
    initialData,
    onSubmit,
    isSubmitting,
}: AdsFormProps) {
    const { toast } = useToast();
    const storage = getStorage(app);
    const [uploading, setUploading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<AdFormData>({
        resolver: zodResolver(adSchema),
        defaultValues: initialData || {
            title: '',
            imageUrl: '',
            linkUrl: '',
            active: true,
            position: 'directory',
            clientId: '',
        },
    });

    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    React.useEffect(() => {
        const fetchClients = async () => {
            setLoadingClients(true);
            try {
                const db = getFirestore(app);
                const q = query(collection(db, 'clients'), orderBy('clientName', 'asc'));
                const snapshot = await getDocs(q);
                const clientList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().clientName || "Unknown"
                }));
                setClients(clientList);
            } catch (error) {
                console.error("Failed to fetch clients", error);
                toast({ title: "Error", description: "Failed to load clients list", variant: 'destructive' });
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    const imageUrl = watch('imageUrl');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `ads/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true });
            toast({ title: 'Success', description: 'Banner uploaded successfully' });
        } catch (error) {
            console.error('Upload failed:', error);
            toast({
                title: 'Error',
                description: `Failed to upload banner: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title">Banner Title (Internal Name)</Label>
                <Input id="title" {...register('title')} placeholder="e.g. Summer Sale Promo" />
                {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label>Banner Image</Label>
                <div className="flex flex-col gap-4">
                    {imageUrl && (
                        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
                            <Image
                                src={imageUrl}
                                alt="Ad Banner"
                                fill
                                className="object-cover"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute right-2 top-2 h-8 w-8"
                                onClick={() => setValue('imageUrl', '')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {!imageUrl && (
                        <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                <UploadCloud className="mb-3 h-8 w-8 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    SVG, PNG, JPG or GIF (MAX. 800x400px)
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                    )}
                    {errors.imageUrl && (
                        <p className="text-sm text-red-500">{errors.imageUrl.message}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="linkUrl">Target Link</Label>
                    <Input
                        id="linkUrl"
                        {...register('linkUrl')}
                        placeholder="https://client-site.com/promo"
                    />
                    {errors.linkUrl && (
                        <p className="text-sm text-red-500">{errors.linkUrl.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Select
                        onValueChange={(val) => setValue('position', val as any)}
                        defaultValue={watch('position')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="directory">Directory (Every 10 items)</SelectItem>
                            <SelectItem value="sidebar">Sidebar</SelectItem>
                            <SelectItem value="home">Home Page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="clientId">Client (Payer)</Label>
                <Select
                    onValueChange={(val) => setValue('clientId', val)}
                    defaultValue={watch('clientId')}
                    disabled={loadingClients}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client"} />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                                {client.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.clientId && (
                    <p className="text-sm text-red-500">{errors.clientId.message}</p>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="active"
                    checked={watch('active')}
                    onCheckedChange={(checked) => setValue('active', checked)}
                />
                <Label htmlFor="active">Active (Visible to users)</Label>
            </div>

            <Button type="submit" disabled={isSubmitting || uploading} className="w-full">
                {isSubmitting ? 'Saving...' : 'Save Banner'}
            </Button>
        </form>
    );
}
