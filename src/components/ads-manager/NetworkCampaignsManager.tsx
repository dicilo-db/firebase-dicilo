'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Plus, Upload, Image as ImageIcon, X, Trash2, Users, MousePointerClick, Target, Euro, TrendingUp } from 'lucide-react';
import { getCampaigns, updateCampaign, deleteCampaign, ClientOption, getClientsForSelect, createCampaign } from '@/app/actions/campaigns';
import { getAdCampaigns } from '@/app/actions/ads-manager';
import { CampaignAsset } from '@/types/freelancer';
import { CampaignAssetEditor } from './CampaignAssetEditor';
import { uploadImage } from '@/app/actions/upload';
import { translateText } from '@/app/actions/translate';
import { correctText } from '@/app/actions/grammar';
import Image from 'next/image';
import { Sparkles, Languages, ChevronDown, Rocket, Layers, Check, Lock, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { collection, addDoc, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const AVAILABLE_LANGUAGES = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' }
];

const LANG_MAP: Record<string, string> = {
    'es': 'Spanish',
    'en': 'English',
    'de': 'German'
};

const COMMERCIAL_FEATURES = [
    {
        key: 'max_campaigns_retailer',
        labelDe: 'Verwaltung von bis zu 10 Kampagnen (Retailer)',
        labelEs: 'Gestión de hasta 10 campañas (Retailer)'
    },
    {
        key: 'max_campaigns_premium',
        labelDe: 'Verwaltung von bis zu 40 Kampagnen (Premium)',
        labelEs: 'Gestión de hasta 40 campañas (Premium)'
    },
    {
        key: 'unlimited_content',
        labelDe: 'Unbegrenzte Veröffentlichung von Inhalten',
        labelEs: 'Publicación ilimitada de contenidos'
    },
    {
        key: 'competitor_analysis_10',
        labelDe: 'Analyse von bis zu 10 Wettbewerbern',
        labelEs: 'Análisis de hasta 10 competidores'
    },
    {
        key: 'competitor_analysis_50',
        labelDe: 'Analyse von bis zu 50 Wettbewerbern',
        labelEs: 'Análisis de hasta 50 competidores'
    },
    {
        key: 'twitter_access',
        labelDe: "Zugriff auf Twitter / 'X'",
        labelEs: "Acceso a Twitter / 'X'"
    },
    {
        key: 'linkedin_connection',
        labelDe: 'Verbindung mit LinkedIn',
        labelEs: 'Conexión con LinkedIn'
    },
    {
        key: 'facebook_connection',
        labelDe: 'Verbindung mit Facebook',
        labelEs: 'Conexión con Facebook'
    },
    {
        key: 'reporting_tools',
        labelDe: 'Zugriff auf Reporting-Tools',
        labelEs: 'Acceso a herramientas de informes'
    },
    {
        key: 'pdf_reports',
        labelDe: 'Berichte als PDF',
        labelEs: 'Informes en PDF'
    },
    {
        key: 'link_shortener',
        labelDe: 'Link-Kürzung-Seiten',
        labelEs: 'Acortador de enlaces'
    },
    {
        key: 'unlimited_history',
        labelDe: 'Zugriff auf Analysen mit unbegrenzter Historie per Länder',
        labelEs: 'Acceso a análisis con historial ilimitado por países'
    },
    {
        key: 'canva_integration',
        labelDe: 'Integration mit Canva',
        labelEs: 'Integración con Canva'
    },
    {
        key: 'google_drive_integration',
        labelDe: 'Integration mit Google Drive Individuell',
        labelEs: 'Integración individual con Google Drive'
    }
];

const PERFORMANCE_TRANSLATIONS: Record<string, any> = {
    es: {
        performanceTitle: "Rendimiento de la Campaña",
        back: "Volver",
        activeFreelancers: "Freelancers Activos",
        totalClicks: "Clics Totales",
        totalConversions: "Conversiones Totales",
        consumedBudget: "Presupuesto Consumido",
        remainingBudget: "Presupuesto Restante",
        chartTitle: "Evolución Temporal de la Campaña",
        chartClicks: "Clics",
        chartConversions: "Conversiones",
        chartFreelancers: "Freelancers (acumulado)",
        promotersTableTitle: "Freelancers Promotores",
        freelancerId: "ID Freelancer",
        joiningDate: "Fecha Unión",
        clicks: "Clics",
        conversions: "Conversiones",
        postStatus: "Estado del Post",
        bonusStatus: "Bono Rendimiento",
        bonusPaid: "Pagado (0.10€)",
        bonusPending: "Pendiente",
        active: "Activo",
        inactive: "Inactivo",
        noFreelancersYet: "Aún no hay freelancers promocionando esta campaña.",
        noDataChart: "No hay suficientes datos temporales para mostrar el gráfico.",
        loadingData: "Cargando datos de rendimiento..."
    },
    en: {
        performanceTitle: "Campaign Performance",
        back: "Back",
        activeFreelancers: "Active Freelancers",
        totalClicks: "Total Clicks",
        totalConversions: "Total Conversions",
        consumedBudget: "Consumed Budget",
        remainingBudget: "Remaining Budget",
        chartTitle: "Campaign Temporal Evolution",
        chartClicks: "Clicks",
        chartConversions: "Conversions",
        chartFreelancers: "Freelancers (cumulative)",
        promotersTableTitle: "Promoter Freelancers",
        freelancerId: "Freelancer ID",
        joiningDate: "Joining Date",
        clicks: "Clicks",
        conversions: "Conversions",
        postStatus: "Post Status",
        bonusStatus: "Performance Bonus",
        bonusPaid: "Paid (0.10€)",
        bonusPending: "Pending",
        active: "Active",
        inactive: "Inactive",
        noFreelancersYet: "There are no freelancers promoting this campaign yet.",
        noDataChart: "Not enough temporal data to display the chart.",
        loadingData: "Loading performance data..."
    },
    de: {
        performanceTitle: "Kampagnenleistung",
        back: "Zurück",
        activeFreelancers: "Aktive Freelancer",
        totalClicks: "Gesamt-Klicks",
        totalConversions: "Gesamt-Conversions",
        consumedBudget: "Verbrauchtes Budget",
        remainingBudget: "Verbleibendes Budget",
        chartTitle: "Zeitlicher Verlauf der Kampagne",
        chartClicks: "Klicks",
        chartConversions: "Conversions",
        chartFreelancers: "Freelancer (kumuliert)",
        promotersTableTitle: "Werbende Freelancer",
        freelancerId: "Freelancer-ID",
        joiningDate: "Beitrittsdatum",
        clicks: "Klicks",
        conversions: "Conversions",
        postStatus: "Post-Status",
        bonusStatus: "Leistungsbonus",
        bonusPaid: "Bezahlt (0.10€)",
        bonusPending: "Ausstehend",
        active: "Aktiv",
        inactive: "Inaktiv",
        noFreelancersYet: "Es gibt noch keine Freelancer, die für diese Kampagne werben.",
        noDataChart: "Nicht genügend zeitliche Daten vorhanden, um das Diagramm anzuzeigen.",
        loadingData: "Leistungsdaten werden geladen..."
    }
};

interface ContentBlock {
    title: string;
    description: string;
    suggestedText: string;
}

export function NetworkCampaignsManager({ onBack, clientId }: { onBack?: () => void, clientId?: string }) {
    const { t, i18n } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'create' | 'performance'>('list');
    const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
    const [links, setLinks] = useState<any[]>([]);
    const [loadingLinks, setLoadingLinks] = useState(false);

    // B2B Campaign Request states
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [requestData, setRequestData] = useState({ goal: '', budget: '', audience: '' });
    const [sendingRequest, setSendingRequest] = useState(false);

    // Form State - v2.0 Refactor
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    // List & Edit State
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        clientId: '',
        budgetTotal: 1000,
        rewardPerAction: 0.20,
        dailyLimit: 10,
        startDate: '',
        endDate: '',
        allowedLanguages: ['es'] as string[],
        targetUrls: {} as Record<string, string[]>,
        images: [] as string[],
        assets: [] as CampaignAsset[],
        features: {} as Record<string, boolean>,
    });

    const [content, setContent] = useState<Record<string, ContentBlock>>({
        es: { title: '', description: '', suggestedText: '' },
        en: { title: '', description: '', suggestedText: '' },
        de: { title: '', description: '', suggestedText: '' }
    });

    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Temp state for adding target URLs
    const [tempTargetLang, setTempTargetLang] = useState<string>('');
    const [tempTargetUrl, setTempTargetUrl] = useState<string>('');

    // AI State
    const [aiLoading, setAiLoading] = useState<string | null>(null); // 'lang-field' identifier

    // Collapsible features panel state
    const [featuresPanelOpen, setFeaturesPanelOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        if (view === 'create' && user) {
            loadClients();
        } else if (view === 'list' && user) {
            loadCampaigns();
            // Reset editing state when entering list view
            setEditingId(null);
            setSelectedCampaign(null);
            setLinks([]);
            resetForm();
        }
    }, [view, user]);

    useEffect(() => {
        if (view === 'performance' && selectedCampaign?.id) {
            setLoadingLinks(true);
            
            // Subscribe to freelancer_links
            const q = query(
                collection(db, 'freelancer_links'),
                where('campaignId', '==', selectedCampaign.id)
            );
            const unsubscribeLinks = onSnapshot(q, (snapshot) => {
                const fetchedLinks = snapshot.docs.map(docDoc => ({
                    id: docDoc.id,
                    ...docDoc.data()
                }));
                setLinks(fetchedLinks);
                setLoadingLinks(false);
            }, (error) => {
                console.error("Error loading links:", error);
                setLoadingLinks(false);
            });

            // Subscribe to campaign document for real-time budget synchronization
            const campaignRef = doc(db, 'campaigns', selectedCampaign.id);
            const unsubscribeCampaign = onSnapshot(campaignRef, (snapshot) => {
                if (snapshot.exists()) {
                    setSelectedCampaign({
                        id: snapshot.id,
                        ...snapshot.data()
                    });
                }
            }, (error) => {
                console.error("Error subscribing to campaign:", error);
            });

            return () => {
                unsubscribeLinks();
                unsubscribeCampaign();
            };
        }
    }, [view, selectedCampaign?.id]);

    const chartData = React.useMemo(() => {
        if (!links || links.length === 0) return [];
        
        // Group active links by date
        const dailyData: Record<string, { posts: number, clicks: number, conversions: number }> = {};
        
        links.forEach(link => {
            if (link.status === 'draft') return;
            
            let dateStr = '';
            if (link.createdAt) {
                const date = typeof link.createdAt.toDate === 'function' 
                    ? link.createdAt.toDate() 
                    : new Date(link.createdAt);
                if (!isNaN(date.getTime())) {
                    dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
                }
            }
            
            if (!dateStr) return;
            
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { posts: 0, clicks: 0, conversions: 0 };
            }
            
            dailyData[dateStr].posts += 1;
            dailyData[dateStr].clicks += (link.clickCount || 0);
            dailyData[dateStr].conversions += (link.conversionCount || 0);
        });
        
        // Sort dates
        const sortedDates = Object.keys(dailyData).sort();
        
        // Build cumulative list
        let cumulativePosts = 0;
        let cumulativeClicks = 0;
        let cumulativeConversions = 0;
        
        return sortedDates.map(dateStr => {
            cumulativePosts += dailyData[dateStr].posts;
            cumulativeClicks += dailyData[dateStr].clicks;
            cumulativeConversions += dailyData[dateStr].conversions;
            
            // Format date for display (DD/MM)
            const parts = dateStr.split('-');
            const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
            
            return {
                date: formattedDate,
                freelancers: cumulativePosts,
                clicks: cumulativeClicks,
                conversions: cumulativeConversions
            };
        });
    }, [links]);

    const resetForm = () => {
        setFormData({
            clientId: '',
            budgetTotal: 1000,
            rewardPerAction: 0.20,
            dailyLimit: 10,
            startDate: '',
            endDate: '',
            allowedLanguages: ['es', 'en', 'de'], // Default to all 3
            targetUrls: {} as Record<string, string[]>,
            images: [] as string[],
            assets: [] as CampaignAsset[],
            features: {} as Record<string, boolean>,
        });
        setContent({
            es: { title: '', description: '', suggestedText: '' },
            en: { title: '', description: '', suggestedText: '' },
            de: { title: '', description: '', suggestedText: '' }
        });
        setEditingId(null);
    };

    const loadCampaigns = async () => {
        if (!user) return;
        setLoadingCampaigns(true);
        try {
            if (clientId) {
                const res = await getAdCampaigns(clientId, 'social_product');
                if (res.success && res.campaigns) {
                    setCampaigns(res.campaigns);
                } else {
                    toast({ title: 'Error', description: 'Failed to load client campaigns', variant: 'destructive' });
                }
            } else {
                const token = await user.getIdToken();
                const res = await getCampaigns(token);
                if (res.success && res.campaigns) {
                    setCampaigns(res.campaigns);
                } else {
                    toast({ title: 'Error', description: 'Failed to load campaigns', variant: 'destructive' });
                }
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: 'Error', description: e.message || 'Error', variant: 'destructive' });
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const handleSendRequest = async () => {
        if (!requestData.goal || !requestData.budget) {
            toast({ title: 'Error', description: 'Por favor, llena los campos obligatorios.', variant: 'destructive' });
            return;
        }
        setSendingRequest(true);
        try {
            await addDoc(collection(db, 'campaign_requests'), {
                clientId: clientId,
                goal: requestData.goal,
                budget: Number(requestData.budget),
                audience: requestData.audience,
                status: 'pending',
                createdAt: new Date()
            });
            toast({ title: '¡Solicitud enviada!', description: 'Un asesor de DiciloMarketing te contactará pronto.' });
            setIsRequestOpen(false);
            setRequestData({ goal: '', budget: '', audience: '' });
        } catch (error: any) {
            console.error(error);
            toast({ title: 'Error', description: 'No se pudo enviar la solicitud.', variant: 'destructive' });
        } finally {
            setSendingRequest(false);
        }
    };

    const handleEdit = (campaign: any) => {
        setSelectedCampaign(campaign);
        if (clientId) {
            setView('performance');
            return;
        }

        setEditingId(campaign.id);

        // Map backend snake_case to frontend camelCase
        let initialAssets: CampaignAsset[] = campaign.assets || [];

        // Migration Logic: If no assets but we have legacy images, create assets from them
        if (initialAssets.length === 0 && campaign.images && campaign.images.length > 0) {
            initialAssets = campaign.images.map((imgUrl: string) => ({
                id: crypto.randomUUID(),
                imageUrl: imgUrl,
                baseText: campaign.description || campaign.content_map?.es?.description || '', // Pre-fill with campaign desc
                sourceLanguage: campaign.languages?.[0] || 'es',
                translations: {
                    es: campaign.content_map?.es?.description || campaign.description || '',
                    en: campaign.content_map?.en?.description || '',
                    de: campaign.content_map?.de?.description || ''
                }
            }));
            // Ensure we use valid property names from CampaignAsset type
        }

        // Ensure we have at least the stored languages, but default to all 3 if missing or logic dictates
        const campaignLangs = campaign.languages && campaign.languages.length > 0 ? campaign.languages : ['es', 'en', 'de'];

        // Per user request: "We handle 3 languages", so let's encourage it by merging defaults if they want
        // But strictly speaking, we should respect what was saved. 
        // However, user says "English is missing", implies they want it added now.
        // Let's ensure 'en' is present if it's missing but 'es' is there, or just trust the campaign.
        // Actually, if I just modify the state here to include them, it will show up.
        // Let's force all 3 for now as per "manejamos tres idiomas" implication, or at least union.
        const mergedLangs = Array.from(new Set([...campaignLangs, 'es', 'en', 'de']));

        setFormData({
            clientId: campaign.clientId || campaign.client_id || '',
            budgetTotal: campaign.budget_total || 0,
            rewardPerAction: campaign.reward_per_action || 0,
            dailyLimit: campaign.daily_limit_per_user || 10,
            startDate: campaign.start_date || '',
            endDate: campaign.end_date || '',
            allowedLanguages: mergedLangs, // Force all 3 available for editing
            targetUrls: (function () {
                const raw = campaign.target_urls || {};
                const normalized: Record<string, string[]> = {};
                Object.keys(raw).forEach(key => {
                    const val = raw[key];
                    if (Array.isArray(val)) normalized[key] = val;
                    else if (typeof val === 'string') normalized[key] = [val];
                });
                return normalized;
            })(),
            images: campaign.images || [],
            assets: initialAssets,
            features: campaign.features || {},
        });

        // Map content
        const newContent = { ...content };
        if (campaign.content_map) {
            Object.keys(campaign.content_map).forEach(lang => {
                // @ts-ignore
                newContent[lang] = campaign.content_map[lang];
            });
        }
        setContent(newContent);

        setView('create');
    };

    const loadClients = async () => {
        if (!user) return;
        setLoadingClients(true);
        try {
            const token = await user.getIdToken();
            const res = await getClientsForSelect(token);
            if (res.success && res.clients) {
                setClients(res.clients);
            } else {
                console.error("Load Clients Error:", res.error);
                toast({
                    title: 'Error',
                    description: res.error || t('networkCampaigns.form.loadError'),
                    variant: 'destructive'
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingClients(false);
        }
    };




    const handleDelete = async (campaignId: string) => {
        if (!confirm(t('networkCampaigns.form.deleteConfirm', 'Are you sure you want to delete this campaign?'))) return;
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const res = await deleteCampaign(token, campaignId);
            if (res.success) {
                toast({ title: 'Success', description: 'Campaign deleted' });
                loadCampaigns(); // Reload list
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    };

    const handleLanguageToggle = (langCode: string) => {
        setFormData(prev => {
            const current = prev.allowedLanguages;
            if (current.includes(langCode)) {
                return { ...prev, allowedLanguages: current.filter(c => c !== langCode) };
            } else {
                return { ...prev, allowedLanguages: [...current, langCode] };
            }
        });
    };

    const handleContentChange = (lang: string, field: keyof ContentBlock, value: string) => {
        setContent(prev => ({
            ...prev,
            [lang]: { ...prev[lang], [field]: value }
        }));
    };

    // AI Actions
    const handleAITranslate = async (targetLang: string, field: keyof ContentBlock, sourceLang: string) => {
        const sourceText = content[sourceLang]?.[field];
        if (!sourceText) {
            toast({ title: "Source Empty", description: "No text to translate in source language.", variant: "destructive" });
            return;
        }

        const loaderKey = `${targetLang}-${field}`;
        setAiLoading(loaderKey);

        try {
            const res = await translateText(sourceText, LANG_MAP[targetLang] || targetLang);
            if (res.success && res.translation) {
                handleContentChange(targetLang, field, res.translation);
                toast({ title: t('networkCampaigns.form.ai.apply'), description: t('networkCampaigns.form.ai.translated', { lang: sourceLang.toUpperCase() }) });
            } else {
                toast({ title: "Error", description: res.error || "Translation failed", variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Translation failed", variant: "destructive" });
        } finally {
            setAiLoading(null);
        }
    };

    const handleAICorrect = async (lang: string, field: keyof ContentBlock) => {
        const currentText = content[lang]?.[field];
        if (!currentText) return;

        const loaderKey = `${lang}-${field}`;
        setAiLoading(loaderKey);

        try {
            const res = await correctText(currentText, LANG_MAP[lang] || lang);
            if (res.success && res.correctedText) {
                handleContentChange(lang, field, res.correctedText);
                toast({ title: t('networkCampaigns.form.ai.apply'), description: t('networkCampaigns.form.ai.autoFixed') });
            } else {
                toast({ title: "Error", description: "Correction failed", variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Correction failed", variant: "destructive" });
        } finally {
            setAiLoading(null);
        }
    };


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (formData.images.length >= 60) {
            toast({ title: 'Limit Reached', description: t('networkCampaigns.form.maxImages'), variant: 'destructive' });
            return;
        }

        setUploading(true);
        const data = new FormData();
        data.append('file', file);
        data.append('path', `campaigns/${Date.now()}_${file.name}`);

        try {
            const res = await uploadImage(data);
            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, images: [...prev.images, res.url as string] }));
                toast({ title: 'Success', description: 'Image uploaded' });
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: t('networkCampaigns.form.uploading'), variant: 'destructive' });
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // 4. Validate
        if (!formData.clientId) {
            toast({ title: 'Validation', description: t('networkCampaigns.form.validation.client'), variant: 'destructive' });
            return;
        }
        if (formData.allowedLanguages.length === 0) {
            toast({ title: 'Validation', description: t('networkCampaigns.form.validation.lang'), variant: 'destructive' });
            return;
        }
        if (formData.assets.length === 0 && formData.images.length === 0) {
            toast({ title: 'Validation', description: t('networkCampaigns.form.validation.image'), variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            const token = await user.getIdToken();
            const relevantContent: any = {};
            formData.allowedLanguages.forEach(lang => {
                relevantContent[lang] = content[lang];
            });

            const payload = {
                ...formData,
                content: relevantContent,
                // Ensure images array is populated from assets for backward compat if needed (but we use assets primarily now)
                images: formData.assets.length > 0 ? formData.assets.map(a => a.imageUrl) : formData.images
            };

            let res;
            if (editingId) {
                res = await updateCampaign(token, editingId, payload);
            } else {
                res = await createCampaign(token, payload);
            }

            if (res.success) {
                toast({ title: 'Success', description: t('networkCampaigns.form.success'), className: 'bg-green-600 text-white' });
                setView('list');
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }

        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to render AI-enhanced text area
    const renderContentField = (lang: string, field: keyof ContentBlock, label: string, placeholder: string, isTextarea = false) => {
        const textValue = content[lang]?.[field] || '';
        const isLoading = aiLoading === `${lang}-${field}`;
        const hasText = textValue.length > 0;

        // Target languages (Active ones)
        // If I am in 'es', I can translate to 'es', 'en', 'de'
        const targetLangs = formData.allowedLanguages;

        return (
            <div className="space-y-2 relative group">
                <div className="flex justify-between items-end">
                    <Label>{label} ({lang.toUpperCase()})</Label>

                    {/* AI Toolbar */}
                    {!clientId && (
                        <div className="flex gap-2">
                            {/* Translate TO ... */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50/50" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3 mr-1" />}
                                        {t('networkCampaigns.form.ai.translateTo')} <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {targetLangs.map(targetLang => (
                                        <DropdownMenuItem key={targetLang} onClick={() => handleAITranslate(targetLang, field, lang)}>
                                            {targetLang.toUpperCase()} {targetLang === lang ? '(Current)' : ''}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Grammar Correction (visible if text exists) */}
                            {hasText && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-purple-600 hover:text-purple-800 bg-purple-50/50"
                                    onClick={() => handleAICorrect(lang, field)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                    {t('networkCampaigns.form.ai.improve')}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {isTextarea ? (
                    <Textarea
                        value={textValue}
                        onChange={e => handleContentChange(lang, field, e.target.value)}
                        placeholder={placeholder}
                        className={field === 'suggestedText' ? "hidden" : ""} // Hide suggestedText as it is replaced by Assets
                        disabled={isLoading || !!clientId}
                    />
                ) : (
                    <Input
                        value={textValue}
                        onChange={e => handleContentChange(lang, field, e.target.value)}
                        placeholder={placeholder}
                        disabled={isLoading || !!clientId}
                    />
                )}
            </div>
        );
    };

    if (view === 'list') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{t('networkCampaigns.list.title')}</h2>
                        <p className="text-muted-foreground">{t('networkCampaigns.list.subtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        {onBack && <Button variant="outline" onClick={onBack}>{t('networkCampaigns.back')}</Button>}
                        {clientId ? (
                            <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 font-bold">
                                        <Plus className="w-4 h-4"/> Solicitar Nueva Campaña
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Solicitar Campaña Publicitaria</DialogTitle>
                                        <DialogDescription>
                                            Nuestro equipo de marketing diseñará la segmentación perfecta y el copy de éxito para ti.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="gap-4 py-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="goal" className="text-sm font-medium font-sans">Objetivo principal <span className="text-red-500">*</span></Label>
                                            <Input id="goal" placeholder="Ej: Vender stock antiguo, más tráfico web..." value={requestData.goal} onChange={e => setRequestData({...requestData, goal: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="budget" className="text-sm font-medium font-sans">Presupuesto Sugerido (€) *</Label>
                                            <Input id="budget" type="number" placeholder="Ej: 500" value={requestData.budget} onChange={e => setRequestData({...requestData, budget: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="audience" className="text-sm font-medium font-sans">Vecindario o Demografía (Opcional)</Label>
                                            <Textarea id="audience" placeholder="Ej: Mujeres de 25-45 años cerca de mi local" rows={3} value={requestData.audience} onChange={e => setRequestData({...requestData, audience: e.target.value})} />
                                        </div>
                                    </div>
                                    <Button 
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                                        onClick={handleSendRequest}
                                        disabled={sendingRequest}
                                    >
                                        {sendingRequest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                                        Enviar Solicitud al Experto
                                    </Button>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Button onClick={() => setView('create')}>
                                <Plus className="mr-2 h-4 w-4" /> {t('networkCampaigns.list.create')}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4">
                    {loadingCampaigns ? (
                        <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
                    ) : campaigns.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <p>{t('networkCampaigns.list.empty')}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {campaigns.map(campaign => (
                                <Card key={campaign.id} className="flex flex-row items-center p-4 gap-4 hover:shadow-md transition-shadow">
                                    <div className="h-16 w-24 relative bg-slate-100 rounded-md overflow-hidden shrink-0">
                                        {campaign.images?.[0] ? (
                                            <Image src={campaign.images[0]} alt="" fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full"><ImageIcon className="h-6 w-6 text-slate-300" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold truncate">{campaign.content_map?.es?.title || campaign.title || 'Untitled Campaign'}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${new Date(campaign.end_date) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {new Date(campaign.end_date) < new Date() ? 'Ended' : 'Active'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                            <span>📅 {campaign.start_date} - {campaign.end_date}</span>
                                            <span>💰 {campaign.budget_total}€</span>
                                            <span>Reward: {campaign.reward_per_action}€</span>
                                        </div>
                                    </div>
                                    {clientId ? (
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                                            Ver Detalles
                                        </Button>
                                    ) : (
                                        <>
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                                                Edit
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(campaign.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'performance' && selectedCampaign) {
        const currentLang = i18n.language?.split('-')[0] || 'es';
        const trans = PERFORMANCE_TRANSLATIONS[currentLang] || PERFORMANCE_TRANSLATIONS.es;

        // Perform KPI calculations
        const activeLinks = links.filter(l => l.status !== 'draft');
        const activeFreelancersCount = new Set(activeLinks.map(l => l.freelancerId)).size;
        const totalClicks = activeLinks.reduce((acc, l) => acc + (l.clickCount || 0), 0);
        const totalConversions = activeLinks.reduce((acc, l) => acc + (l.conversionCount || 0), 0);

        // Budget calculations (V1 vs V2 support)
        const consumedBudget = activeLinks.reduce((acc, l) => {
            if (l.paymentModel === 'fixed_plus_bonus') {
                return acc + 0.50 + (l.bonusPaidStatus ? 0.10 : 0);
            } else {
                const rate = selectedCampaign.reward_per_action || selectedCampaign.rate_per_click || 0.20;
                return acc + (l.clickCount || 0) * rate;
            }
        }, 0);

        const remainingBudget = selectedCampaign.budget_remaining !== undefined 
            ? selectedCampaign.budget_remaining 
            : (selectedCampaign.budget_total - consumedBudget);

        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-none hover:bg-emerald-500/20">
                                {selectedCampaign.payment_model === 'fixed_plus_bonus' ? 'V2 (CPA + Bonus)' : 'V1 (CPC)'}
                            </Badge>
                            <span className="text-xs text-slate-400">ID: {selectedCampaign.id}</span>
                        </div>
                        <h1 className="text-2xl font-bold">{selectedCampaign.content_map?.[currentLang]?.title || selectedCampaign.title || trans.performanceTitle}</h1>
                        <p className="text-sm text-slate-300 mt-1 max-w-2xl line-clamp-2">
                            {selectedCampaign.content_map?.[currentLang]?.description || selectedCampaign.description || ''}
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => setView('list')} 
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white self-start md:self-center"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> {trans.back}
                    </Button>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Active Freelancers */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">{trans.activeFreelancers}</CardTitle>
                            <Users className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {loadingLinks ? <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> : activeFreelancersCount}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Registrados en la campaña</p>
                        </CardContent>
                    </Card>

                    {/* Total Clicks */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">{trans.totalClicks}</CardTitle>
                            <MousePointerClick className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {loadingLinks ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> : totalClicks}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Clics únicos acumulados</p>
                        </CardContent>
                    </Card>

                    {/* Total Conversions */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">{trans.totalConversions}</CardTitle>
                            <Target className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {loadingLinks ? <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> : totalConversions}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Registros / Compras completados</p>
                        </CardContent>
                    </Card>

                    {/* Consumed Budget */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">{trans.consumedBudget}</CardTitle>
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {loadingLinks ? <Loader2 className="h-5 w-5 animate-spin text-amber-500" /> : `${consumedBudget.toFixed(2)}€`}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {selectedCampaign.payment_model === 'fixed_plus_bonus' 
                                    ? "Posts creados + bonos de 5 clics" 
                                    : `Basado en clics (${selectedCampaign.reward_per_action || selectedCampaign.rate_per_click || 0.20}€ / click)`}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Remaining Budget */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">{trans.remainingBudget}</CardTitle>
                            <Euro className="h-4 w-4 text-teal-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {`${remainingBudget.toFixed(2)}€`}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.max(0, Math.min(100, (remainingBudget / (selectedCampaign.budget_total || 1)) * 100))}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    {Math.round((remainingBudget / (selectedCampaign.budget_total || 1)) * 100)}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Graph & Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Time Series Analytics Chart */}
                    <Card className="lg:col-span-2 shadow-sm border-slate-100">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">{trans.chartTitle}</CardTitle>
                            <CardDescription>Crecimiento acumulado en el tiempo</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            {loadingLinks ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    <p className="text-sm text-muted-foreground">{trans.loadingData}</p>
                                </div>
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorFreelancers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#94a3b8" 
                                            fontSize={11} 
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis 
                                            stroke="#94a3b8" 
                                            fontSize={11} 
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <RechartsTooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                            }}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" />
                                        <Area 
                                            type="monotone" 
                                            dataKey="clicks" 
                                            name={trans.chartClicks} 
                                            stroke="#3b82f6" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#colorClicks)" 
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="conversions" 
                                            name={trans.chartConversions} 
                                            stroke="#10b981" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#colorConversions)" 
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="freelancers" 
                                            name={trans.chartFreelancers} 
                                            stroke="#6366f1" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#colorFreelancers)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground border border-dashed rounded-lg bg-slate-50/50">
                                    {trans.noDataChart}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Campaign Details Info Sidebar */}
                    <Card className="shadow-sm border-slate-100 bg-slate-50/30">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Detalles de Campaña</CardTitle>
                            <CardDescription>Parámetros configurados</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between border-b pb-2 border-slate-100">
                                <span className="text-muted-foreground">Fecha Inicio:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCampaign.start_date}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 border-slate-100">
                                <span className="text-muted-foreground">Fecha Fin:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCampaign.end_date}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 border-slate-100">
                                <span className="text-muted-foreground">Presupuesto Inicial:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCampaign.budget_total}€</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 border-slate-100">
                                <span className="text-muted-foreground">Pago por Post (Creación):</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">0.50€</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 border-slate-100">
                                <span className="text-muted-foreground">Bono de Rendimiento (5 clics):</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">0.10€</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 border-slate-100">
                                <span className="text-muted-foreground">Idiomas Permitidos:</span>
                                <span className="font-semibold flex items-center gap-1">
                                    {(selectedCampaign.allowed_languages || []).map((lang: string) => (
                                        <span key={lang} className={`fi fi-${lang === 'en' ? 'gb' : lang} rounded-sm w-4 h-3`} title={lang.toUpperCase()} />
                                    ))}
                                </span>
                            </div>
                            <div className="pt-2">
                                <span className="text-muted-foreground block mb-2">URLs de Destino por Idioma:</span>
                                <div className="space-y-1.5">
                                    {Object.entries(selectedCampaign.target_urls || {}).flatMap(([lang, urls]) => 
                                        (Array.isArray(urls) ? urls : []).map((url, idx) => (
                                            <div key={`${lang}-${idx}`} className="flex items-center gap-2 bg-white dark:bg-slate-900 border rounded p-1.5 text-xs">
                                                <span className={`fi fi-${lang === 'en' ? 'gb' : lang} rounded-sm w-4 h-3 shrink-0`} />
                                                <span className="truncate text-blue-600 underline flex-1 select-all" title={url}>{url}</span>
                                            </div>
                                        ))
                                    )}
                                    {(!selectedCampaign.target_urls || Object.keys(selectedCampaign.target_urls).length === 0) && (
                                        <p className="text-xs text-muted-foreground italic">No se configuraron URLs específicas. Se usará el enlace del anunciante por defecto.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* B2B Commercial Features Checklist */}
                <Card className="shadow-sm border-slate-100 overflow-hidden bg-white dark:bg-slate-900">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Layers className="h-5 w-5 text-orange-600" />
                            Inbegriffene Funktionen / Características Incluidas
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Gewerbliche Features und Limits für diese Kampagne / Características y límites comerciales incluidos para esta campaña
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {COMMERCIAL_FEATURES.map(feat => {
                                const isEnabled = !!selectedCampaign.features?.[feat.key];
                                return (
                                    <div 
                                        key={feat.key} 
                                        className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all ${
                                            isEnabled 
                                                ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30' 
                                                : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/20 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg shrink-0 ${
                                            isEnabled 
                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                        }`}>
                                            {isEnabled ? (
                                                <Check className="h-4 w-4 stroke-[3]" />
                                            ) : (
                                                <Lock className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-xs font-bold leading-tight ${isEnabled ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {feat.labelDe}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                                                {feat.labelEs}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Freelancers List Table */}
                <Card className="shadow-sm border-slate-100">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-lg font-bold">{trans.promotersTableTitle}</CardTitle>
                        <CardDescription>Resumen de actividad de cada colaborador</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingLinks ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            </div>
                        ) : activeLinks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">{trans.freelancerId}</th>
                                            <th className="px-6 py-4 font-semibold">{trans.joiningDate}</th>
                                            <th className="px-6 py-4 font-semibold text-center">{trans.clicks}</th>
                                            <th className="px-6 py-4 font-semibold text-center">{trans.conversions}</th>
                                            <th className="px-6 py-4 font-semibold text-center">{trans.postStatus}</th>
                                            <th className="px-6 py-4 font-semibold text-center">{trans.bonusStatus}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {activeLinks.map(l => {
                                            const anonId = 'FL-' + (l.freelancerId ? l.freelancerId.substring(l.freelancerId.length - 6).toUpperCase() : 'UNKNOWN');
                                            
                                            let joinedDateStr = '-';
                                            if (l.createdAt) {
                                                const d = typeof l.createdAt.toDate === 'function' ? l.createdAt.toDate() : new Date(l.createdAt);
                                                joinedDateStr = !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
                                            }

                                            return (
                                                <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-semibold text-slate-900 dark:text-white">{anonId}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">{joinedDateStr}</td>
                                                    <td className="px-6 py-4 text-center font-semibold text-slate-800 dark:text-slate-200">{l.clickCount || 0}</td>
                                                    <td className="px-6 py-4 text-center font-semibold text-slate-800 dark:text-slate-200">{l.conversionCount || 0}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 border-none px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                            {trans.active}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {l.bonusPaidStatus ? (
                                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                                {trans.bonusPaid}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-slate-500 dark:text-slate-400 border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                                {trans.bonusPending}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Users className="h-10 w-10 text-slate-300 mb-2" />
                                <p className="text-slate-500 text-sm font-medium">{trans.noFreelancersYet}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4">
            <Button variant="ghost" onClick={() => setView('list')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('networkCampaigns.back')}
            </Button>

            <form onSubmit={handleSubmit}>
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>{editingId ? 'Kampagne bearbeiten' : t('networkCampaigns.form.cardTitle')}</CardTitle>
                        <CardDescription>{editingId ? 'Bearbeiten Sie die Details der Kampagne.' : t('networkCampaigns.form.cardDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* 1. Global Settings & Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.clientLabel')}</Label>
                                <Select
                                    value={formData.clientId}
                                    onValueChange={(val) => setFormData(p => ({ ...p, clientId: val }))}
                                    disabled={loadingClients || !!clientId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingClients ? t('networkCampaigns.form.loading') : t('networkCampaigns.form.selectClient')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.startDate')}</Label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                                    required
                                    disabled={!!clientId}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.endDate')}</Label>
                                <Input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))}
                                    required
                                    disabled={!!clientId}
                                />
                            </div>
                        </div>

                        {/* Financials & Limits */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.totalBudget')}</Label>
                                <Input type="number" value={formData.budgetTotal} onChange={e => setFormData(p => ({ ...p, budgetTotal: parseFloat(e.target.value) }))} step="0.01" min="0" disabled={!!clientId} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.freelancerReward')}</Label>
                                <Input type="number" value={formData.rewardPerAction} onChange={e => setFormData(p => ({ ...p, rewardPerAction: parseFloat(e.target.value) }))} step="0.01" min="0" disabled={!!clientId} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.dailyLimit')}</Label>
                                <Input type="number" value={formData.dailyLimit} onChange={e => setFormData(p => ({ ...p, dailyLimit: parseInt(e.target.value) }))} min={1} disabled={!!clientId} />
                            </div>
                        </div>

                        {/* 2. Languages */}
                        <div className="space-y-3">
                            <Label>{t('networkCampaigns.form.languages')}</Label>
                            <div className="flex gap-4 p-4 border rounded-lg bg-slate-50">
                                {AVAILABLE_LANGUAGES.map(lang => (
                                    <div key={lang.code} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`lang-${lang.code}`}
                                            checked={formData.allowedLanguages.includes(lang.code)}
                                            onCheckedChange={() => handleLanguageToggle(lang.code)}
                                            disabled={!!clientId}
                                        />
                                        <label htmlFor={`lang-${lang.code}`} className="text-sm font-medium leading-none cursor-pointer select-none">{lang.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2.5 Target URLs (Ziel des Kampagne) - Dynamic List */}
                        <div className="space-y-4 p-5 border border-orange-200 rounded-lg bg-orange-50/30">
                            <div>
                                <Label className="text-lg font-semibold flex items-center gap-2 text-orange-900">
                                    🎯 {t('networkCampaigns.form.targetUrls', 'Ziel der Kampagnen')}
                                </Label>
                                <p className="text-sm text-balance text-muted-foreground mt-1 mb-4">
                                    {t('networkCampaigns.form.targetUrlsDesc', 'Definieren Sie spezifische Zielseiten für jede Sprache. Wenn keine URL definiert ist, wird standardmäßig die Webseite des Unternehmens verwendet.')}
                                </p>
                            </div>

                            {/* List of Added URLs */}
                            <div className="space-y-3 mb-4">
                                {Object.entries(formData.targetUrls).flatMap(([lang, urls]) =>
                                    (Array.isArray(urls) ? urls : []).map((url, idx) => {
                                        const langLabel = AVAILABLE_LANGUAGES.find(l => l.code === lang)?.label || lang.toUpperCase();
                                        return (
                                            <div key={`${lang}-${idx}`} className="flex items-center gap-3 bg-white p-2 rounded border shadow-sm animate-in fade-in slide-in-from-left-2">
                                                <div className="w-28 font-medium text-sm flex items-center gap-2 px-2">
                                                    <span className={`fi fi-${lang === 'en' ? 'gb' : lang} rounded-sm`} />
                                                    {langLabel}
                                                </div>
                                                <div className="flex-1 text-sm truncate text-blue-600 underline" title={url}>
                                                    {url}
                                                </div>
                                                {!clientId && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            setFormData(prev => {
                                                                const newUrls = { ...prev.targetUrls };
                                                                newUrls[lang] = newUrls[lang].filter((_, i) => i !== idx);
                                                                if (newUrls[lang].length === 0) delete newUrls[lang];
                                                                return { ...prev, targetUrls: newUrls };
                                                            });
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Add New URL Input */}
                            {!clientId && (
                                <div className="flex gap-2 items-end">
                                    <div className="space-y-1 shrink-0 w-28">
                                        <Label className="text-xs">{t('networkCampaigns.form.language', 'Language')}</Label>
                                        <Select value={tempTargetLang} onValueChange={setTempTargetLang}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formData.allowedLanguages.map(lang => (
                                                    <SelectItem key={lang} value={lang}>
                                                        {AVAILABLE_LANGUAGES.find(l => l.code === lang)?.label || lang.toUpperCase()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <Label className="text-xs">Ziel-URL (Landing Page)</Label>
                                        <Input
                                            placeholder="https://beispiel.de/landing-page"
                                            className="h-9"
                                            value={tempTargetUrl}
                                            onChange={e => setTempTargetUrl(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (tempTargetLang && tempTargetUrl) {
                                                        setFormData(prev => {
                                                            const currentUrls = prev.targetUrls[tempTargetLang] || [];
                                                            if (currentUrls.length >= 10) {
                                                                toast({ title: "Limit erreicht", description: "Max 10 URLs pro Sprache.", variant: "destructive" });
                                                                return prev;
                                                            }
                                                            return {
                                                                ...prev,
                                                                targetUrls: { ...prev.targetUrls, [tempTargetLang]: [...currentUrls, tempTargetUrl] }
                                                            };
                                                        });
                                                        setTempTargetUrl('');
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 bg-green-600 hover:bg-green-700 text-white"
                                        disabled={!tempTargetLang || !tempTargetUrl}
                                        onClick={() => {
                                            if (tempTargetLang && tempTargetUrl) {
                                                setFormData(prev => {
                                                    const currentUrls = prev.targetUrls[tempTargetLang] || [];
                                                    if (currentUrls.length >= 10) {
                                                        toast({ title: "Limit erreicht", description: "Max 10 URLs pro Sprache.", variant: "destructive" });
                                                        return prev;
                                                    }
                                                    return {
                                                        ...prev,
                                                        targetUrls: { ...prev.targetUrls, [tempTargetLang]: [...currentUrls, tempTargetUrl] }
                                                    };
                                                });
                                                setTempTargetUrl('');
                                            }
                                        }}
                                    >
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                            {!clientId && formData.allowedLanguages.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                    Bitte wählen Sie zuerst oben Sprachen aus.
                                </p>
                            )}
                        </div>

                        {/* 2.8 Gewerbliche Features & Limits (Admin Only) */}
                        {!clientId && (
                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/20">
                                <button
                                    type="button"
                                    onClick={() => setFeaturesPanelOpen(!featuresPanelOpen)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-orange-600 animate-pulse" />
                                        Gewerbliche Features & Limits / Características y Límites B2B
                                    </span>
                                    {featuresPanelOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>
                                
                                {featuresPanelOpen && (
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white dark:bg-slate-950 animate-in fade-in-50 duration-200">
                                        {COMMERCIAL_FEATURES.map(feat => (
                                            <div 
                                                key={feat.key} 
                                                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/30 transition-all"
                                            >
                                                <div className="space-y-0.5 max-w-[80%]">
                                                    <Label htmlFor={`switch-${feat.key}`} className="text-sm font-semibold block text-slate-800 dark:text-slate-200 leading-tight">
                                                        {feat.labelDe}
                                                    </Label>
                                                    <span className="text-[11px] text-muted-foreground block leading-tight">
                                                        {feat.labelEs}
                                                    </span>
                                                </div>
                                                <Switch
                                                    id={`switch-${feat.key}`}
                                                    checked={!!formData.features[feat.key]}
                                                    onCheckedChange={(checked) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            features: {
                                                                ...prev.features,
                                                                [feat.key]: checked
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Assets (V2) */}
                        <div className="space-y-4 pt-4 border-t">
                            {/* Sync Assets with Legacy Images for now if needed, but Editor manages assets independently */}
                            <CampaignAssetEditor
                                assets={formData.assets}
                                onAssetsChange={newAssets => setFormData(p => ({ ...p, assets: newAssets }))}
                                allowedLanguages={formData.allowedLanguages}
                                readOnly={!!clientId}
                            />
                        </div>

                        {/* Legacy Image Upload (Hidden/Removed in favor of Asset Editor) */}
                        {/* We keep the state for compatibility, but UI is replaced */}

                        {/* 4. Content (Campaign Details Only) */}
                        <div className="space-y-2 pt-4 border-t">
                            <Label className="text-lg font-semibold">{t('networkCampaigns.form.content')} (Listing Details)</Label>
                            <Tabs
                                key={formData.allowedLanguages.join(',')}
                                defaultValue={formData.allowedLanguages[0] || 'es'}
                                className="w-full"
                            >
                                <TabsList>
                                    {formData.allowedLanguages.map(lang => (
                                        <TabsTrigger key={lang} value={lang} className="flex items-center gap-2">
                                            <span className={`fi fi-${lang === 'en' ? 'gb' : lang} rounded-sm`} />
                                            {AVAILABLE_LANGUAGES.find(l => l.code === lang)?.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {formData.allowedLanguages.map(lang => (
                                    <TabsContent key={lang} value={lang} className="space-y-4 pt-4">
                                        {renderContentField(lang, 'title', t('networkCampaigns.form.title'), 'Campaign Title')}
                                        {renderContentField(lang, 'description', t('networkCampaigns.form.description'), 'Short description for the dashboard card', true)}
                                        {/* Suggested Text Field is now HIDDEN via renderContentField logic above */}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 sticky bottom-0 bg-white p-4 border-t shadow-inner z-10">
                        <Button type="button" variant="outline" onClick={() => setView('list')}>
                            {clientId ? 'Volver' : t('common:cancel', 'Cancel')}
                        </Button>
                        {!clientId && (
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? t('common:update', 'Update Campaign') : t('common:create', 'Create Campaign')}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
