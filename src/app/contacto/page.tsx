'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarCheck, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import NativeBookingDialog from '@/components/shared/NativeBookingDialog';

export default function ContactPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-black text-slate-900 text-center mb-4">{t('contact.title', 'Central de Contacto Dicilo')}</h1>
        <p className="text-slate-600 text-center mb-12 text-lg">{t('contact.subtitle', 'Acércate a nuestro Team Office. Estamos listos para ayudarte a potenciar tu negocio.')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card: Agendar Llamada Calendly */}
          <Card className="border-emerald-200 bg-emerald-50/50 shadow-md">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <CalendarCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{t('contact.book.title', 'Agenda una Reunión')}</h2>
              <p className="text-slate-600 flex-1">
                {t('contact.book.desc', '¿Tienes dudas sobre cómo escalar tu negocio? Agenda una videollamada de 30 minutos con un asesor personalizado. Elige el horario que mejor se adapte a tu posibilidad.')}
              </p>
              
              <NativeBookingDialog trigger={
                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6 shadow-lg shadow-emerald-600/20">
                  {t('contact.book.button', 'Ver Disponibilidad y Agendar')}
                </Button>
              } />
            </CardContent>
          </Card>

          {/* Card: Oficinas Centrales */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-8 flex flex-col space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 border-b pb-4">{t('contact.office.title', 'Nuestras Oficinas')}</h2>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t('contact.office.hq', 'Sede Principal')}</h3>
                  <p className="text-slate-600 mt-1">
                    Mühlendamm 84a<br />
                    22087 Hamburg<br />
                    Deutschland
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t('contact.office.phone', 'Atención Telefónica')}</h3>
                  <p className="text-slate-600 mt-1">
                    {t('contact.office.mon_fri', 'Lunes a Viernes')}<br />
                    09:00 AM - 18:00 PM<br />
                    <span className="font-medium text-slate-800">WhatsApp: +49 178 83 38 735</span>
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t font-medium text-sm text-slate-500 text-center">
                {t('contact.office.note', '* Las visitas presenciales requieren cita previa.')}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
