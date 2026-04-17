'use client';

import { useTranslation } from 'react-i18next';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NativeBookingDialog from '@/components/shared/NativeBookingDialog';
import { 
    Zap, Eye, MousePointerClick, CalendarRange, 
    Share2, MapPin, Megaphone, Briefcase, BarChart, 
    Smartphone, UserPlus, Wrench, Coins, Wallet, MessageSquare
} from 'lucide-react';

export default function BusinessDashboardPage() {
    const { name, plan } = useBusinessAccess();
    const { t } = useTranslation('common');

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900" dangerouslySetInnerHTML={{ __html: t('business.dashboard.title', 'Portal <span class="text-blue-600">B2B</span>').replace('span className', 'span class') }}></h1>
                <p className="text-slate-500 mt-2 text-lg" dangerouslySetInnerHTML={{ __html: t('business.dashboard.welcome', { name: name || 'Empresa', defaultValue: `Hola, <strong>${name || 'Empresa'}</strong>. Qué bueno tenerte de vuelta.` }) }}></p>
            </div>

            {/* SECCIÓN: Visión General */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">{t('business.dashboard.overviewTitle', 'Visión General')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('business.dashboard.planTitle', 'Tu Plan Actual')}</CardTitle>
                            <Zap className={`w-4 h-4 ${plan === 'premium' ? 'text-amber-500' : 'text-blue-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 capitalize">{plan || 'Básico'}</div>
                            <p className="text-xs text-slate-500 mt-1">{t('business.dashboard.planDesc', 'Suscripción activa en Dicilo')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('business.dashboard.visitsTitle', 'Visitas a tu Perfil')}</CardTitle>
                            <Eye className="w-4 h-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">---</div>
                            <p className="text-xs text-slate-500 mt-1">{t('business.dashboard.visitsDesc', 'Últimos 30 días')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('business.dashboard.clicksTitle', 'Clics en Botones')}</CardTitle>
                            <MousePointerClick className="w-4 h-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">---</div>
                            <p className="text-xs text-slate-500 mt-1">{t('business.dashboard.clicksDesc', 'Hacia tu web / teléfono')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('business.dashboard.couponsTitle', 'Cupones Usados')}</CardTitle>
                            <CalendarRange className="w-4 h-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">---</div>
                            <p className="text-xs text-slate-500 mt-1">{t('business.dashboard.couponsDesc', 'Canjes validados')}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* SECCIÓN: Finanzas & Wallets */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">{t('business.dashboard.walletsTitle', 'Tus Wallets')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 border-none shadow-md text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-100 uppercase tracking-wider">{t('business.dashboard.dicipointsTitle', 'DiciPoints (Rewards)')}</CardTitle>
                            <Coins className="w-5 h-5 text-yellow-300" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">---</div>
                            <p className="text-xs text-blue-200 mt-1">{t('business.dashboard.dicipointsDesc', 'Puntos disponibles para anuncios')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none shadow-md text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-teal-100 uppercase tracking-wider">{t('business.dashboard.prepaidTitle', 'Saldo Prepago')}</CardTitle>
                            <Wallet className="w-5 h-5 text-white" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">€ ---</div>
                            <p className="text-xs text-teal-200 mt-1">{t('business.dashboard.prepaidDesc', 'Fondos añadidos a tu billetera')}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* SECCIÓN: Servicios B2B y Análisis */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">{t('business.dashboard.servicesTitle', 'Servicios & Análisis')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('business.dashboard.socialTitle', 'Redes Sociales')}</CardTitle>
                            <Share2 className="w-4 h-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-900 mt-1">{t('business.dashboard.socialStatus', 'Sin Vincular')}</div>
                            <p className="text-xs text-slate-500 mt-1">{t('business.dashboard.socialDesc', 'Conecta tus cuentas')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('business.dashboard.geoTitle', 'Geomarketing')}</CardTitle>
                            <MapPin className="w-4 h-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-900 mt-1">{t('business.dashboard.geoStatus', 'Activo')}</div>
                            <p className="text-xs text-slate-500 mt-1">{t('business.dashboard.geoDesc', 'Visibilidad en tu zona')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('business.dashboard.campaignsTitle', 'Campañas Personalizadas')}</CardTitle>
                            <Megaphone className="w-4 h-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-900 mt-1">{t('business.dashboard.campaignsStatus', '0 Activas')}</div>
                            <p className="text-xs text-slate-500 mt-1">{t('business.dashboard.campaignsDesc', 'Usa tus DiciPoints')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('business.dashboard.inquiriesTitle', 'Consultas Comerciales')}</CardTitle>
                            <Briefcase className="w-4 h-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-900 mt-1">---</div>
                            <p className="text-xs text-slate-500 mt-1">{t('business.dashboard.inquiriesDesc', 'Nuevos leads (B2B)')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('business.dashboard.statsTitle', 'Estadísticas')}</CardTitle>
                            <BarChart className="w-4 h-4 text-sky-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-900 mt-1">{t('business.dashboard.statsStatus', 'Ver Reporte')}</div>
                            <p className="text-xs text-slate-500 mt-1">{t('business.dashboard.statsDesc', 'Analítica detallada')}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* SECCIÓN: Soporte y Asistencia */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">{t('business.dashboard.supportTitle', 'Centro de Soporte')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-green-50 border-green-100 shadow-sm hover:bg-green-100 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 uppercase tracking-wider">{t('business.dashboard.waTitle', 'WhatsApp')}</CardTitle>
                            <MessageSquare className="w-4 h-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-green-900 mt-1">{t('business.dashboard.waStatus', 'Contactar Ahora')}</div>
                            <p className="text-xs text-green-700 mt-1">{t('business.dashboard.waDesc', 'Asistencia en tiempo real')}</p>
                        </CardContent>
                    </Card>

                    <NativeBookingDialog trigger={
                        <Card className="h-full bg-blue-50 border-blue-100 shadow-sm hover:bg-blue-100 transition-colors cursor-pointer hover:shadow-md outline-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-blue-700 uppercase tracking-wider">{t('business.dashboard.indivTitle', 'Soporte Individual')}</CardTitle>
                                <UserPlus className="w-4 h-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-blue-900 mt-1">{t('business.dashboard.indivStatus', 'Agendar Llamada')}</div>
                                <p className="text-xs text-blue-700 mt-1">{t('business.dashboard.indivDesc', 'Asesoría personalizada')}</p>
                            </CardContent>
                        </Card>
                    } />

                    <Card className="bg-slate-50 border-slate-200 shadow-sm hover:bg-slate-100 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-700 uppercase tracking-wider">{t('business.dashboard.techTitle', 'Soporte Técnico')}</CardTitle>
                            <Wrench className="w-4 h-4 text-slate-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-slate-900 mt-1">{t('business.dashboard.techStatus', 'Crear Ticket')}</div>
                            <p className="text-xs text-slate-600 mt-1">{t('business.dashboard.techDesc', 'Resolución de problemas')}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Banner based on plan */}
            {plan !== 'premium' && (
                <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-md">
                    <h3 className="text-2xl font-bold mb-2">{t('business.dashboard.bannerTitle', { name })}</h3>
                    <p className="text-blue-100 max-w-2xl mb-6">{t('business.dashboard.bannerDesc', 'Construye tu propia Micro-Web con nuestro "Page Editor", vende en línea, administra catálogos y paga anuncios usando los DiciPoints de tu Wallet cambiando a Premium.')}</p>
                    <a href="/planes" className="bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
                        {t('business.dashboard.bannerBtn', 'Mejorar a Premium')}
                    </a>
                </div>
            )}
        </div>
    );
}
