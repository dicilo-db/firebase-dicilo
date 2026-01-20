'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Upload, FileText, File, Save, ArrowLeft, Search, Folder, Database, Building } from 'lucide-react';
import { getFirestore, collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp, setDoc, where, limit } from 'firebase/firestore';
import Link from 'next/link';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';
import { processUploadedFile } from '@/app/actions/ai-admin';
import { ClientData } from '@/types/client';
import { Category } from '@/types/category';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const db = getFirestore(app);
const storage = getStorage(app);

// --- TYPES ---
interface KnowledgeSnippet {
    id: string;
    text: string;
    createdAt: any;
    clientId?: string; // Links to Premium Client
    category?: string;
}

interface KnowledgeFile {
    id: string;
    name: string;
    url: string;
    type: string;
    createdAt: any;
    clientId?: string; // Links to Premium Client
    category?: string;
}

// --- COMPONENTS ---

// --- SUB-COMPONENT FOR CHAT HISTORY LIST ---
function ChatHistoryList({ sessions, searchTerm }: { sessions: any[], searchTerm: string }) {
    const filtered = sessions.filter(s => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        // Robust catch-all search: Convert entire session object to string
        return JSON.stringify(s).toLowerCase().includes(term);
    });

    return (
        <div className="rounded-md border bg-white mt-4">
            <div className="flex justify-between items-center p-4 bg-muted border-b">
                <div className="grid grid-cols-12 gap-4 w-full font-medium text-sm text-muted-foreground">
                    <div className="col-span-3">ID / Fecha</div>
                    <div className="col-span-7">Último Mensaje</div>
                    <div className="col-span-2 text-right">Msgs</div>
                </div>
            </div>

            <div className="px-4 py-2 text-xs text-muted-foreground bg-slate-50 border-b">
                Loaded {sessions.length} sessions. Showing {filtered.length} matches.
            </div>

            <div className="divide-y max-h-[400px] overflow-y-auto">
                {filtered.map(session => {
                    const messages = session.messages || [];
                    const lastMsg = messages[messages.length - 1];
                    return (
                        <div key={session.id} className="grid grid-cols-12 gap-4 p-4 text-sm hover:bg-slate-50 transition-colors cursor-default">
                            <div className="col-span-3">
                                <div className="font-mono text-xs text-indigo-600 truncate" title={session.id}>{session.id.slice(0, 8)}...</div>
                                <div className="text-xs text-muted-foreground">
                                    {session.lastUpdated ? new Date(session.lastUpdated.toDate ? session.lastUpdated.toDate() : session.lastUpdated).toLocaleString() : 'N/A'}
                                </div>
                            </div>
                            <div className="col-span-7">
                                <p className="truncate text-slate-700 font-medium">
                                    {lastMsg?.role === 'user' ? 'User: ' : 'Bot: '}
                                    {lastMsg?.content || '(Empty)'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate opacity-70">
                                    {messages[messages.length - 2]?.content || ''}
                                </p>
                            </div>
                            <div className="col-span-2 text-right text-xs bg-slate-100 rounded self-center py-1 px-2 w-fit justify-self-end">
                                {messages.length} msgs
                            </div>
                        </div>
                    );
                })}
                {sessions.length === 0 && <div className="p-8 text-center text-red-500">No sessions loaded from DB. Check Firestore permissions or path.</div>}
                {sessions.length > 0 && filtered.length === 0 && <div className="p-8 text-center text-muted-foreground">No hay conversaciones que coincidan.</div>}
            </div>
        </div>
    );
}

export default function AdminAiChatPage() {
    const { t } = useTranslation('admin');
    const { toast } = useToast();

    // --- STATE ---
    const [viewMode, setViewMode] = useState<'dashboard' | 'client-folder' | 'global-folder'>('dashboard');
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

    // Data List States
    const [clients, setClients] = useState<ClientData[]>([]); // All Premium & Retailer Clients
    const [categories, setCategories] = useState<Category[]>([]);
    const [globalSnippets, setGlobalSnippets] = useState<KnowledgeSnippet[]>([]);

    // Client Folder States
    const [clientSnippets, setClientSnippets] = useState<KnowledgeSnippet[]>([]);
    const [clientFiles, setClientFiles] = useState<KnowledgeFile[]>([]);

    // Chat History States
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [searchChatTerm, setSearchChatTerm] = useState('');

    // Filters & UI
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

    // Editor States
    const [newSnippet, setNewSnippet] = useState('');
    const [isSavingSnippet, setIsSavingSnippet] = useState(false);
    const [isUploading, setIsUploading] = useState(false);


    // --- LOAD INITIAL DATA (Dashboard) ---
    useEffect(() => {
        // 1. Load Categories
        const catUnsub = onSnapshot(query(collection(db, 'categories'), orderBy('name.de')), (snap) => {
            const cats = snap.docs.map(d => d.data() as Category);
            setCategories(cats);
        });

        // 2. Load Premium & Retailer Clients
        const clientQuery = query(collection(db, 'clients'), where('clientType', 'in', ['premium', 'retailer']));
        const clientUnsub = onSnapshot(clientQuery, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientData));
            setClients(data);
        });

        // 3. Load Global Knowledge (No clientId)
        const snippetUnsub = onSnapshot(query(collection(db, 'ai_knowledge_snippets'), orderBy('createdAt', 'desc')), (snap) => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeSnippet));
            setGlobalSnippets(all.filter(s => !s.clientId)); // Only global
        });

        return () => {
            catUnsub();
            clientUnsub();
            snippetUnsub();
        };
    }, []);

    // --- LOAD CHAT HISTORY ---
    useEffect(() => {
        // Load last 100 sessions for global search and client filtering
        const q = query(collection(db, 'chat_sessions'), orderBy('lastUpdated', 'desc'), limit(100)); // limit 100
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setChatHistory(data);
        });
        return () => unsub();
    }, []);

    // --- CLIENT FOLDER LOGIC ---
    useEffect(() => {
        if (!selectedClient) return;

        // Load Client Specific Snippets
        const qSnippets = query(collection(db, 'ai_knowledge_snippets'), where('clientId', '==', selectedClient.id));
        const unsubSnippets = onSnapshot(qSnippets, (snap) => {
            setClientSnippets(snap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeSnippet)));
        });

        // Load Client Specific Files
        const qFiles = query(collection(db, 'ai_knowledge_files'), where('clientId', '==', selectedClient.id));
        const unsubFiles = onSnapshot(qFiles, (snap) => {
            setClientFiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeFile)));
        });

        return () => {
            unsubSnippets();
            unsubFiles();
        };
    }, [selectedClient]);


    // --- HANDLERS ---

    const handleSelectClient = (client: ClientData) => {
        setSelectedClient(client);
        setViewMode('client-folder');
        setNewSnippet(''); // Reset editor
    };

    const handleBackToDashboard = () => {
        setSelectedClient(null);
        setViewMode('dashboard');
    };

    const handleAddSnippet = async (isGlobal: boolean) => {
        if (!newSnippet.trim()) return;
        setIsSavingSnippet(true);
        try {
            const data: any = {
                text: newSnippet,
                createdAt: serverTimestamp(),
            };

            if (!isGlobal && selectedClient) {
                data.clientId = selectedClient.id;
                data.category = selectedClient.category || 'general';
            }

            // If global mode, no clientId added
            await addDoc(collection(db, 'ai_knowledge_snippets'), data);
            setNewSnippet('');
            toast({ title: t('ai_chat.save_fact'), description: isGlobal ? 'Global snippet added.' : t('ai_chat.save_fact') });
        } catch (error) {
            console.error(error);
            toast({ title: t('ai_chat.save_fact'), description: 'Error', variant: 'destructive' });
        } finally {
            setIsSavingSnippet(false);
        }
    };

    const handleDeleteSnippet = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await deleteDoc(doc(db, 'ai_knowledge_snippets', id));
            toast({ title: 'Deleted', description: 'Snippet removed.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete.' });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClient) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `ai-knowledge/${selectedClient.id}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);

            const docRef = await addDoc(collection(db, 'ai_knowledge_files'), {
                name: file.name,
                url: url,
                type: file.type,
                fullPath: snapshot.metadata.fullPath,
                createdAt: serverTimestamp(),
                clientId: selectedClient.id,
                status: 'processing'
            });

            const result = await processUploadedFile(docRef.id, snapshot.metadata.fullPath, file.type);

            if (result.success) {
                toast({ title: 'Success', description: 'File processed for RGA.' });
            } else {
                toast({ title: 'Uploaded', description: 'Processing warning: ' + result.error });
            }

        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Upload failed.', variant: 'destructive' });
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteFile = async (file: KnowledgeFile) => {
        if (!confirm('Start deletion?')) return;
        try {
            await deleteDoc(doc(db, 'ai_knowledge_files', file.id));
            toast({ title: 'Success', description: 'File record deleted.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete file.', variant: 'destructive' });
        }
    };

    // --- RENDER HELPERS ---
    const filteredClients = clients.filter(c => {
        const matchesSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategoryFilter === 'all' || c.category === selectedCategoryFilter;
        return matchesSearch && matchesCategory;
    });


    // --- VIEW: DASHBOARD ---
    if (viewMode === 'dashboard') {
        return (
            <div className="container mx-auto p-6 space-y-8 animate-in fade-in-50">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild className="gap-2">
                            <Link href="/admin/dashboard">
                                <ArrowLeft className="h-4 w-4" />
                                {t('common.back')}
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                {t('ai_chat.library_title')}
                            </h1>
                            <p className="text-muted-foreground">{t('ai_chat.library_subtitle')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* LEFT COLUMN: FILTERS & GLOBAL */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="bg-slate-50 border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-sm">{t('ai_chat.search_title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('ai_chat.search_label')}</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t('ai_chat.search_placeholder')}
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('ai_chat.category_label')}</Label>
                                    <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('ai_chat.all_categories')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('ai_chat.all_categories')}</SelectItem>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name.de}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Database className="h-4 w-4" /> {t('ai_chat.global_knowledge')}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {t('ai_chat.global_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {globalSnippets.slice(0, 3).map(s => (
                                    <div key={s.id} className="text-xs p-2 bg-muted rounded border truncate">
                                        {s.text}
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setViewMode('global-folder')}>
                                    {t('ai_chat.view_all_global')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: CLIENT GRID */}
                    <div className="md:col-span-3 space-y-8">
                        {/* SEARCH CHAT CARD */}
                        <Card className="bg-gradient-to-br from-white to-slate-50 border-indigo-100">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base text-indigo-900">
                                    <Search className="h-4 w-4" /> Buscador de Conversaciones (Global)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Input
                                        placeholder="Buscar texto en conversaciones..."
                                        value={searchChatTerm}
                                        onChange={e => setSearchChatTerm(e.target.value)}
                                    />
                                    {searchChatTerm && (
                                        <ChatHistoryList sessions={chatHistory} searchTerm={searchChatTerm} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* CLIENT GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredClients.map(client => (
                                <Card
                                    key={client.id}
                                    className="cursor-pointer transition-all hover:shadow-md hover:border-indigo-400 group"
                                    onClick={() => handleSelectClient(client)}
                                >
                                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                                            {client.clientLogoUrl ? (
                                                <img src={client.clientLogoUrl} alt={client.clientName} className="h-full w-full object-cover" />
                                            ) : (
                                                <Building className="h-8 w-8 text-slate-300" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-indigo-600 transition-colors">{client.clientName}</h3>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{client.category || t('ai_chat.uncategorized')}</p>
                                        </div>
                                        <div className="mt-2 flex gap-2 w-full">
                                            <Button variant="secondary" size="sm" className="w-full gap-2">
                                                <Folder className="h-4 w-4" /> {t('ai_chat.open_folder')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredClients.length === 0 && (
                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                    <p>{t('ai_chat.no_clients_found')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: GLOBAL FOLDER ---
    if (viewMode === 'global-folder') {
        return <GlobalFolderView
            onBack={handleBackToDashboard}
            snippets={globalSnippets}
            onAdd={handleAddSnippet}
            onDelete={handleDeleteSnippet}
            newSnippet={newSnippet}
            setNewSnippet={setNewSnippet}
            isSaving={isSavingSnippet}
            t={t}
        />;
    }

    // --- VIEW: CLIENT FOLDER (THE EDIT MODE) ---
    if (viewMode === 'client-folder' && selectedClient) {
        return (
            <div className="container mx-auto p-6 space-y-6 animate-in slide-in-from-right-10">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b pb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={handleBackToDashboard}>
                            <ArrowLeft className="h-5 w-5 mr-2" /> {t('ai_chat.back_to_library')}
                        </Button>
                        <div className="h-10 w-px bg-slate-200" />
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                                {selectedClient.clientLogoUrl ? (
                                    <img src={selectedClient.clientLogoUrl} alt={selectedClient.clientName} className="h-full w-full object-cover" />
                                ) : (
                                    <Building className="h-6 w-6 text-slate-300" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{selectedClient.clientName}</h1>
                                <p className="text-sm text-muted-foreground">{t('ai_chat.managing_context')} • {selectedClient.category}</p>
                            </div>
                        </div>
                    </div>
                    <Button variant="default" size="sm" className="opacity-0 cursor-default">Actions</Button> {/* Spacer */}
                </div>

                <Tabs defaultValue="knowledge" className="w-full">
                    <TabsList>
                        <TabsTrigger value="knowledge">Conocimiento RGA</TabsTrigger>
                        <TabsTrigger value="history">Historial de Conversaciones</TabsTrigger>
                    </TabsList>

                    <TabsContent value="knowledge" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                        {/* LEFT COLUMN: TEXT KNOWLEDGE */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-indigo-100 shadow-sm">
                                <CardHeader className="bg-indigo-50/50">
                                    <CardTitle className="text-indigo-900 flex items-center gap-2">
                                        <FileText className="h-5 w-5" /> Conocimientos sobre el cliente y comunicación
                                    </CardTitle>
                                    <CardDescription>
                                        {t('ai_chat.snippets_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <Label>{t('ai_chat.add_fact_label')}</Label>
                                        <Textarea
                                            placeholder={t('ai_chat.fact_placeholder')}
                                            className="resize-y min-h-[120px]"
                                            rows={5}
                                            value={newSnippet}
                                            onChange={e => setNewSnippet(e.target.value)}
                                        />
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAddSnippet(false)}
                                                disabled={isSavingSnippet || !newSnippet.trim()}
                                            >
                                                {isSavingSnippet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <Save className="mr-2 h-4 w-4" /> {t('ai_chat.save_fact')}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('ai_chat.saved_facts')} ({clientSnippets.length})</h3>
                                        <div className="space-y-2">
                                            {clientSnippets.length === 0 && <p className="text-sm italic text-muted-foreground">{t('ai_chat.no_facts_yet')}</p>}
                                            {clientSnippets.map(snippet => (
                                                <div key={snippet.id} className="group flex items-start justify-between p-3 rounded-md bg-slate-50 border border-slate-100 text-sm hover:border-indigo-200 transition-colors">
                                                    <p className="whitespace-pre-wrap flex-1 mr-4">{snippet.text}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDeleteSnippet(snippet.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: FILES & MEDIA */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <File className="h-4 w-4" /> {t('ai_chat.documents_title')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-center w-full">
                                        <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground"><span className="font-semibold">{t('ai_chat.upload_instruction')}</span></p>
                                            </div>
                                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept=".pdf,image/*" />
                                        </Label>
                                    </div>
                                    {isUploading && <div className="text-xs text-center text-indigo-600 animate-pulse">{t('ai_chat.processing')}</div>}

                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                        {clientFiles.map(file => (
                                            <div key={file.id} className="flex items-center gap-3 p-2 rounded border bg-white text-xs">
                                                <div className="h-8 w-8 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 shrink-0">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{file.name}</p>
                                                    <a href={file.url} target="_blank" className="text-indigo-500 hover:underline">{t('ai_chat.view_file')}</a>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => handleDeleteFile(file)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial Reciente con {selectedClient.clientName}</CardTitle>
                                <CardDescription>Conversaciones donde se menciona a este cliente.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Filter chat history by client name approx */}
                                <ChatHistoryList
                                    sessions={chatHistory}
                                    searchTerm={selectedClient.clientName}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

            </div>
        )
    }

    return null;
}


// --- SUB-COMPONENT FOR GLOBAL FOLDER ---
function GlobalFolderView({ onBack, snippets, onAdd, onDelete, newSnippet, setNewSnippet, isSaving, t }: any) {
    const [emailLogs, setEmailLogs] = useState<any[]>([]);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, 'email_logs'), orderBy('sentAt', 'desc')), (snap) => {
            setEmailLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    return (
        <div className="container mx-auto p-6 space-y-6 animate-in slide-in-from-right-10">
            <div className="flex items-center gap-4 border-b pb-6">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5 mr-2" /> {t('ai_chat.back_to_library')}
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Database className="h-6 w-6 text-indigo-600" />
                        Conocimiento Global del Sistema
                    </h1>
                    <p className="text-sm text-muted-foreground">Datos generales accesibles para todas las consultas.</p>
                </div>
            </div>

            <Tabs defaultValue="knowledge" className="w-full">
                <TabsList>
                    <TabsTrigger value="knowledge">Base de Conocimiento</TabsTrigger>
                    <TabsTrigger value="emails">Registro de Emails Enviados</TabsTrigger>
                </TabsList>

                <TabsContent value="knowledge" className="space-y-6 mt-6">
                    <Card className="border-indigo-100 shadow-sm">
                        <CardHeader className="bg-indigo-50/50">
                            <CardTitle className="text-indigo-900 flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Global Facts & Rules
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label>{t('ai_chat.add_fact_label')}</Label>
                                <Textarea
                                    placeholder="Enter global fact..."
                                    className="resize-y min-h-[120px]"
                                    rows={5}
                                    value={newSnippet}
                                    onChange={e => setNewSnippet(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button size="sm" onClick={() => onAdd(true)} disabled={isSaving || !newSnippet.trim()}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Save className="mr-2 h-4 w-4" /> Save Global Fact
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {snippets.map((snippet: any) => (
                                    <div key={snippet.id} className="group flex items-start justify-between p-3 rounded-md bg-slate-50 border border-slate-100 text-sm">
                                        <p className="whitespace-pre-wrap flex-1 mr-4">{snippet.text}</p>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400" onClick={() => onDelete(snippet.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="emails" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Envíos (N8N)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="grid grid-cols-12 gap-4 p-4 font-medium bg-muted text-sm">
                                    <div className="col-span-2">Fecha</div>
                                    <div className="col-span-3">Destinatario</div>
                                    <div className="col-span-2">Canal</div>
                                    <div className="col-span-2">Usuario</div>
                                    <div className="col-span-2">Estado</div>
                                    <div className="col-span-1"></div>
                                </div>
                                <div className="divide-y max-h-[500px] overflow-y-auto">
                                    {emailLogs.map((log: any) => (
                                        <div key={log.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-slate-50">
                                            <div className="col-span-2 text-muted-foreground text-xs">
                                                {log.sentAt?.toDate ? log.sentAt.toDate().toLocaleString() : 'N/A'}
                                            </div>
                                            <div className="col-span-3 font-medium truncate" title={log.to}>
                                                {log.to}
                                            </div>
                                            <div className="col-span-2 capitalize badge badge-outline">
                                                {log.channel}
                                            </div>
                                            <div className="col-span-2 truncate">
                                                {log.userName}
                                            </div>
                                            <div className="col-span-2">
                                                <span className={`px-2 py-1 rounded text-xs ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {log.status === 'success' ? 'Enviado' : 'Error'}
                                                </span>
                                            </div>
                                            <div className="col-span-1 text-right">
                                                {/* Details button could go here */}
                                            </div>
                                        </div>
                                    ))}
                                    {emailLogs.length === 0 && <div className="p-8 text-center text-muted-foreground">No hay registros aún.</div>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

