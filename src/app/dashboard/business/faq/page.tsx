'use client';

import React from 'react';
import { CircleHelp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function BusinessFaqsPage() {
    const { t } = useTranslation('faq');

    // Mapeo idéntico al de dicilo.net/faq (22 preguntas)
    const faqItems = Array.from({ length: 22 }, (_, i) => ({
      key: `q${i + 1}`,
    }));

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200 text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                    <CircleHelp className="w-8 h-8 text-teal-600" />
                    Respuestas y Ayuda Técnica
                </h1>
                <p className="text-slate-500 mt-2 text-lg">
                    {t('pageSubtitle', 'Encuentra soluciones a las dudas más comunes sobre la plataforma Dicilo. Pronto integraremos recursos más avanzados para empresas.')}
                </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6">{t('generalQuestions', 'Preguntas Generales')}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => {
                    const question = t(`${item.key}.question`);
                    const answer = t(`${item.key}.answer`);
                    // Ocultamos si la traducción no existe
                    if (question === `${item.key}.question`) return null;

                    return (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-left font-semibold text-slate-700 hover:text-teal-600">
                          {question}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-slate-600 leading-relaxed pt-2">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: answer,
                            }}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
            </div>
            
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center text-teal-800 text-sm font-medium">
                ¿No encontraste lo que buscabas? Recuerda que tienes el panel de <strong>Bandeja Omnicanal</strong> (Soporte) disponible. Pronto lanzaremos las FAQs exclusivas comerciales.
            </div>
        </div>
    );
}
