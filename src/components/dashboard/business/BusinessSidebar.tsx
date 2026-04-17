import { BriefcaseBusiness, Lock, LayoutDashboard, Wallet, Ticket, Package, MessageSquare, BarChart, FileCode2, Megaphone, LifeBuoy, CircleHelp, BrainCircuit, Share2, MapPin, Bot, GraduationCap, Palette, ClipboardList, HeadphonesIcon, ImagePlus, Type, Video, MessageCircle, HeartHandshake, ScanLine, Gift } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAdminUser } from '@/hooks/useAuthGuard';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function BusinessSidebar({ plan, email, isLoading }: { plan: string, email: string | null, isLoading: boolean }) {
    const pathname = usePathname();
    const { t } = useTranslation('common');
    const { user: adminUser } = useAdminUser();
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [lockedFeature, setLockedFeature] = useState('');

    const levels = {
        'basic': 1,
        'starter': 2,
        'retailer': 3,
        'premium': 4,
        'none': 0
    };
    
    const currentLvl = levels[plan as keyof typeof levels] || 0;

    const navItems = [
        { label: t('business.sidebar.dashboard', 'Resumen'), href: '/dashboard/business', icon: LayoutDashboard, reqLvl: 1 },
        { label: t('business.sidebar.financials', 'Mi Wallet'), href: '/dashboard/business/financials', icon: Wallet, reqLvl: 1 },
        { label: t('business.sidebar.invite', 'Invitar Amigos'), href: '/dashboard/business/invite', icon: Gift, reqLvl: 1 },
        { label: t('business.sidebar.scanner', 'Scanner de Cobros'), href: '/dashboard/business/scanner', icon: ScanLine, reqLvl: 2 },
        { label: t('business.sidebar.coupons', 'Mis Cupones'), href: '/dashboard/business/coupons', icon: Ticket, reqLvl: 2 },
        { label: t('business.sidebar.products', 'Gestión de Productos'), href: '/dashboard/business/products', icon: Package, reqLvl: 2 },
        { label: t('business.sidebar.marketIntel', 'Inteligencia de Mercado'), href: '/dashboard/business/market-intelligence', icon: BrainCircuit, reqLvl: 2 },
        { label: t('business.sidebar.socialMedia', 'Redes Sociales'), href: '/dashboard/business/social-media', icon: Share2, reqLvl: 2 },
        { label: t('business.sidebar.geomarketing', 'Geomarketing'), href: '/dashboard/business/geomarketing', icon: MapPin, reqLvl: 2 },
        { label: t('business.sidebar.campaigns', 'Campañas Personalizadas'), href: '/dashboard/business/campaigns', icon: Megaphone, reqLvl: 2 },
        { label: t('business.sidebar.messages', 'Consultas Comerciales'), href: '/dashboard/business/messages', icon: MessageSquare, reqLvl: 2 },
        { label: t('business.sidebar.statistics', 'Estadísticas'), href: '/dashboard/business/statistics', icon: BarChart, reqLvl: 3 },
        { label: t('business.sidebar.pageEditor', 'Landing Page'), href: '/dashboard/business/editor', icon: FileCode2, reqLvl: 3 },
        { label: t('business.sidebar.chatbot', 'Asistente I.A.'), href: '/dashboard/business/chatbot', icon: Bot, reqLvl: 3 },
        { label: t('business.sidebar.courses', 'Cursos I.A.'), href: '/dashboard/business/courses', icon: GraduationCap, reqLvl: 3 },
        { label: t('business.sidebar.graphics', 'Herramientas Gráficas'), href: '/dashboard/business/graphics', icon: Palette, reqLvl: 3 },
        { label: t('business.sidebar.leads', 'Captación de Leads'), href: '/dashboard/business/leads', icon: ClipboardList, reqLvl: 3 },
        { label: t('business.sidebar.supportPremium', 'Soporte Técnico Premium'), href: '/dashboard/business/support-premium', icon: HeadphonesIcon, reqLvl: 3 },
        
        // Premium (Level 4)
        { label: t('business.crm.title', 'Smart CRM & Cotizaciones'), href: '/dashboard/business/crm', icon: BriefcaseBusiness, reqLvl: 4 },
        { label: t('business.sidebar.editGraphics', 'Edición de Gráficos VIP'), href: '/dashboard/business/graphics-vip', icon: ImagePlus, reqLvl: 4 },
        { label: t('business.sidebar.editTexts', 'Edición de Textos VIP'), href: '/dashboard/business/texts-vip', icon: Type, reqLvl: 4 },
        { label: t('business.sidebar.presentations', 'Presentaciones Online'), href: '/dashboard/business/presentations', icon: Video, reqLvl: 4 },
        { label: t('business.sidebar.supportWhatsApp', 'Soporte WhatsApp'), href: '/dashboard/business/whatsapp', icon: MessageCircle, reqLvl: 4 },
        { label: t('business.sidebar.supportIndividual', 'Soporte Individual'), href: '/dashboard/business/support-vip', icon: HeartHandshake, reqLvl: 4 },

        // Global utilities (Always permitted)
        { label: t('business.sidebar.support', 'Soporte Técnico'), href: '/dashboard/business/support', icon: LifeBuoy, reqLvl: 1 },
        { label: t('business.sidebar.faq', 'FAQs'), href: '/dashboard/business/faq', icon: CircleHelp, reqLvl: 1 },
    ];

    const handleClickLocked = (e: React.MouseEvent, featureName: string) => {
        e.preventDefault();
        setLockedFeature(featureName);
        setUpgradeModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="w-64 h-full bg-white border-r border-slate-100 flex flex-col pt-8 px-4 gap-4">
                <Skeleton className="w-full h-8 mb-6" />
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
            </div>
        );
    }

    return (
        <div className="w-64 h-full bg-slate-50 border-r border-slate-200 flex flex-col">
            <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dicilo<span className="text-blue-600">Business</span></h2>
                {email && (
                    <div className="text-xs text-slate-500 mt-1 truncate" title={email}>
                        {email}
                    </div>
                )}
                <Badge variant="outline" className="mt-2 capitalize bg-white text-slate-700 font-medium">
                    Plan: {plan}
                </Badge>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
                {navItems.map((item) => {
                    const isLocked = item.reqLvl > currentLvl;
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (isLocked) {
                        return (
                            <button
                                key={item.href}
                                onClick={(e) => handleClickLocked(e, item.label)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-500 hover:bg-slate-100/60 transition-colors"
                            >
                                <Icon className="w-5 h-5 text-slate-400" />
                                <span className="flex-1 text-left">{item.label}</span>
                                <Lock className="w-4 h-4 text-amber-500" />
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                isActive 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* UPGRADE MODAL */}
            <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-amber-500" />
                            {t('sidebar.locked', 'Función Bloqueada')}
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            El módulo <strong>{lockedFeature}</strong> no está incluido en tu suscripción actual ({plan}).
                            {t('sidebar.lockedDesc', 'Mejora tu plan para acceder a esta herramienta y potenciar tu negocio en Dicilo.')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-between">
                        <Button variant="ghost" onClick={() => setUpgradeModalOpen(false)}>Cancelar</Button>
                        <Link href="/planes" passHref>
                            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                Ver Planes Disponibles
                            </Button>
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
