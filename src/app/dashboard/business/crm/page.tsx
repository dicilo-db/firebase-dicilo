'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BriefcaseBusiness, Users, ReceiptText, Kanavel as Kanban, Plus, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CRMPage() {
    const { t } = useTranslation('common');

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in zoom-in duration-500">
            {/* Header / Hero */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <BriefcaseBusiness className="w-8 h-8 text-blue-300" />
                            {t('business.crm.title', 'Smart CRM & Cotizaciones')}
                        </h1>
                        <p className="mt-3 text-blue-100 max-w-xl text-lg">
                            {t('business.crm.desc', 'Gestiona tus oportunidades comerciales, elabora cotizaciones interactivas (Pro-formas) y envíalas con un clic.')}
                        </p>
                    </div>
                    <div className="shrink-0 bg-white/10 px-6 py-2 rounded-full font-semibold border border-white/20">
                        {t('business.crm.soonStatus', 'Módulo en Construcción (Arquitectura lista)')}
                    </div>
                </div>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 p-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Leads Panel */}
                <Card className="bg-white rounded-2xl p-8 border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100">
                            <Users className="w-7 h-7 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">
                            {t('business.crm.leadsTitle', 'Mis Clientes (Leads)')}
                        </h2>
                        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                            {t('business.crm.leadsDesc', 'Contactos centralizados de la Bandeja Omnicanal.')}
                        </p>
                    </div>
                    <Button variant="outline" className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center justify-center gap-2">
                        {t('business.crm.manageLeadsBtn', 'Ver Directorio de Clientes')} <ArrowRight className="w-4 h-4" />
                    </Button>
                </Card>

                {/* Quotes/Deals Panel */}
                <Card className="bg-white rounded-2xl p-8 border shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                            <ReceiptText className="w-7 h-7 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">
                            {t('business.crm.dealsTitle', 'Cotizaciones y Facturas')}
                        </h2>
                        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                            {t('business.crm.dealsDesc', 'Envía ofertas web o PDF rápidamente extrayendo datos de tu catálogo Dicilo.')}
                        </p>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 relative z-10 shadow-sm">
                        <Plus className="w-4 h-4" /> {t('business.crm.createOfferBtn', 'Generar Nueva Oferta')}
                    </Button>
                </Card>

                {/* Kanban / Pipeline Panel */}
                <Card className="bg-white rounded-2xl p-8 border shadow-sm flex flex-col justify-between lg:col-span-1 md:col-span-2 hover:shadow-md transition-shadow">
                    <div>
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 border border-slate-200">
                            {/* lucide-react doesn't have Kanavel, using LayoutDashboard or Trello equivalent visually */}
                            <svg className="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">
                            {t('business.crm.kanbanTitle', 'Panel de Estado de Cotizaciones')}
                        </h2>
                        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                            {t('business.crm.kanbanDesc', 'Mueve tus cotizaciones: Borrador -> Enviada -> Aceptada.')}
                        </p>
                    </div>
                    <Button variant="outline" className="w-full text-slate-700 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2">
                        {t('business.crm.openKanbanBtn', 'Abrir Panel de Cierres')} <ArrowRight className="w-4 h-4" />
                    </Button>
                </Card>
            </div>
            
            {/* Visual Placeholder for Kanban Board */}
            <div className="mt-12 opacity-50 pointer-events-none select-none filter blur-[1px]">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 px-2">{t('business.crm.demo.title', 'Pipeline de Ventas (Demo)')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-100 rounded-xl p-4 min-h-[300px] border border-slate-200">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('business.crm.demo.drafts', 'Borradores')}</div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-2">
                            <p className="font-semibold text-sm">{t('business.crm.demo.card1', 'Empresa Solar Tech')}</p>
                            <p className="text-xs text-slate-500">€ 4,500.00</p>
                        </div>
                    </div>
                    <div className="bg-blue-50/50 rounded-xl p-4 min-h-[300px] border border-blue-100">
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">{t('business.crm.demo.sent', 'Enviadas')}</div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-200 mb-2 border-l-4 border-l-blue-500">
                            <p className="font-semibold text-sm">{t('business.crm.demo.card2', 'Clínica Dental')}</p>
                            <p className="text-xs text-slate-500">€ 1,200.00</p>
                        </div>
                    </div>
                    <div className="bg-emerald-50/50 rounded-xl p-4 min-h-[300px] border border-emerald-100">
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">{t('business.crm.demo.accepted', 'Aceptadas')}</div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-200 mb-2 border-l-4 border-l-emerald-500">
                            <p className="font-semibold text-sm">{t('business.crm.demo.card3', 'Pedro (Particular)')}</p>
                            <p className="text-xs text-slate-500">€ 350.00</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
