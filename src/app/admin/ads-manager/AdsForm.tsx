'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';
import Image from 'next/image';
import { uploadAdBannerAction } from '@/app/actions/ad-actions';
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Validations
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert("Error: Only PNG, JPG, or GIF files are allowed.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("Error: File size too large (Max 2MB)");
            return;
        }

        setUploading(true);
        // Visual debug helper
        const debugEl = document.getElementById('upload-debug-info');
        if (debugEl) debugEl.innerText = 'Starting server-side upload...';

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Import dynamically to avoid server-client boundary issues if needed, 
            // but standard import should work if 'use server' is at top of action file.
            const result = await uploadAdBannerAction(formData);

            if (result.success && result.url) {
                if (debugEl) debugEl.innerText = 'Upload Complete!';
                console.log("Upload successful:", result.url);
                setValue('imageUrl', result.url, { shouldValidate: true, shouldDirty: true });
                toast({ title: 'Success', description: 'Banner uploaded successfully' });
            } else {
                throw new Error(result.error || 'Upload failed on server');
            }

        } catch (error: any) {
            console.error('Upload failed:', error);
            const errorMsg = error.message || error.code || 'Unknown error';
            if (debugEl) debugEl.innerText = `Error: ${errorMsg}`;
            alert(`Upload Error: ${errorMsg}`);
            toast({
                title: 'Error',
                description: `Failed to upload banner: ${errorMsg}`,
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
                        <div className={`relative flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${uploading ? 'bg-gray-100 border-gray-400' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                            <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                {uploading ? (
                                    <>
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary mb-3"></div>
                                        <p className="mb-2 text-sm text-gray-500">
                                            <span className="font-semibold">Uploading...</span> please wait
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="mb-3 h-8 w-8 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <div className="mt-2 pointer-events-none relative z-0">
                                            <Button type="button" variant="secondary" size="sm" style={{ pointerEvents: 'none' }}>
                                                Select File
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            PNG, JPG or GIF (MAX. 2MB)
                                        </p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="absolute inset-0 z-[100] h-full w-full cursor-pointer opacity-0"
                                accept="image/png, image/jpeg, image/jpg, image/gif"
                                onChange={(e) => {
                                    console.log('File input changed', e.target.files);
                                    handleFileUpload(e);
                                    e.target.value = '';
                                }}
                                disabled={uploading}
                            />
                        </div>
                    )}
                    {errors.imageUrl && (
                        <p className="text-sm text-red-500">{errors.imageUrl.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 text-center" id="upload-debug-info"></p>
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
