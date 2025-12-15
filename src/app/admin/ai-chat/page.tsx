'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Upload, FileText, File, Save, ArrowLeft } from 'lucide-react';
import { getFirestore, collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '@/lib/firebase';
import { processUploadedFile } from '@/app/actions/ai-admin';

const db = getFirestore(app);
const storage = getStorage(app);

interface KnowledgeSnippet {
    id: string;
    text: string;
    createdAt: any;
}

interface KnowledgeFile {
    id: string;
    name: string;
    url: string;
    type: string;
    createdAt: any;
}

export default function AdminAiChatPage() {
    // const { t } = useTranslation('admin'); // Assuming admin namespace exists
    const t = (key: string) => key; // Placeholder until translations are ready
    const { toast } = useToast();
    const [snippets, setSnippets] = useState<KnowledgeSnippet[]>([]);
    const [files, setFiles] = useState<KnowledgeFile[]>([]);
    const [newSnippet, setNewSnippet] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSavingSnippet, setIsSavingSnippet] = useState(false);

    // Fetch Snippets
    useEffect(() => {
        const q = query(collection(db, 'ai_knowledge_snippets'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeSnippet));
            setSnippets(data);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Files
    useEffect(() => {
        const q = query(collection(db, 'ai_knowledge_files'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeFile));
            setFiles(data);
        });
        return () => unsubscribe();
    }, []);

    const handleAddSnippet = async () => {
        if (!newSnippet.trim()) return;
        setIsSavingSnippet(true);
        try {
            await addDoc(collection(db, 'ai_knowledge_snippets'), {
                text: newSnippet,
                createdAt: serverTimestamp(),
            });
            setNewSnippet('');
            toast({ title: 'Success', description: 'Knowledge snippet added.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to add snippet.', variant: 'destructive' });
        } finally {
            setIsSavingSnippet(false);
        }
    };

    const handleDeleteSnippet = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await deleteDoc(doc(db, 'ai_knowledge_snippets', id));
            toast({ title: 'Success', description: 'Snippet deleted.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete snippet.', variant: 'destructive' });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Upload to Storage
            const storageRef = ref(storage, `ai-knowledge/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);

            // 2. Save metadata to Firestore
            const docRef = await addDoc(collection(db, 'ai_knowledge_files'), {
                name: file.name,
                url: url,
                type: file.type,
                fullPath: snapshot.metadata.fullPath,
                createdAt: serverTimestamp(),
                status: 'processing'
            });

            // 3. Trigger Server Processing (Text Extraction)
            const result = await processUploadedFile(docRef.id, snapshot.metadata.fullPath, file.type);

            if (result.success) {
                toast({ title: 'Success', description: 'File uploaded and processed.' });
            } else {
                toast({ title: 'Warning', description: 'File uploaded but processing failed: ' + result.error, variant: 'warning' });
            }

        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Upload failed.', variant: 'destructive' });
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDeleteFile = async (file: KnowledgeFile) => {
        if (!confirm('Start deletion?')) return;
        try {
            // 1. Delete from Firestore
            await deleteDoc(doc(db, 'ai_knowledge_files', file.id));

            // 2. Delete from Storage (best effort, or handle via cloud function trigger)
            // We'll try client side delete if path is known, but for safety usually backend does it.
            // For this MVP, we remove the record.
            toast({ title: 'Success', description: 'File record deleted.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete file.', variant: 'destructive' });
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div className="flex items-center gap-4">
                    <Button variant="default" size="sm" asChild className="gap-2">
                        <Link href="/admin/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">AI Chat Knowledge Base</h1>
                </div>
            </div>

            <Tabs defaultValue="text" className="w-full">
                <TabsList>
                    <TabsTrigger value="text">Text Knowledge</TabsTrigger>
                    <TabsTrigger value="files">Files & Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Knowledge Snippet</CardTitle>
                            <CardDescription>Add specific facts, FAQs, or instructions for the AI.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="e.g., 'Our opening hours are Mon-Fri 9am-5pm.'"
                                value={newSnippet}
                                onChange={(e) => setNewSnippet(e.target.value)}
                                rows={4}
                            />
                            <Button onClick={handleAddSnippet} disabled={isSavingSnippet || !newSnippet.trim()}>
                                {isSavingSnippet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Save Snippet
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        {snippets.map((snippet) => (
                            <Card key={snippet.id}>
                                <CardContent className="p-4 flex justify-between items-start gap-4">
                                    <div className="whitespace-pre-wrap text-sm">{snippet.text}</div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSnippet(snippet.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Documents</CardTitle>
                            <CardDescription>Upload PDFs or Images. The AI will read their content.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Label htmlFor="file-upload" className="cursor-pointer border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 w-full flex flex-col items-center hover:bg-muted/50 transition-colors">
                                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Click to upload (PDF, JPG, PNG)</span>
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        accept=".pdf,image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                </Label>
                            </div>
                            {isUploading && <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</div>}
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        {files.map((file) => (
                            <Card key={file.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-muted/50 rounded flex items-center justify-center">
                                            {file.type.includes('pdf') ? <FileText className="h-5 w-5" /> : <File className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium truncate max-w-[200px] sm:max-w-md">{file.name}</div>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">View File</a>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
