import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Info, DollarSign, ShieldCheck, Zap } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

export function FreelancerRules() {
    const { t } = useTranslation('common');

    return (
        <Card className="w-full bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50 mb-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <GlobeIcon className="h-5 w-5" /> {t('rules.title')}
                </CardTitle>
                <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
                    {t('rules.subtitle')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-b-blue-200 dark:border-blue-800">
                        <AccordionTrigger className="text-sm font-semibold hover:text-blue-700">
                            <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> {t('rules.howToEarn.title')}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground prose dark:prose-invert">
                            <p>{t('rules.howToEarn.desc')}</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>
                                    <Trans i18nKey="rules.howToEarn.points.p1" components={{ 1: <strong /> }} />
                                </li>
                                <li>{t('rules.howToEarn.points.p2')}</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2" className="border-b-blue-200 dark:border-blue-800">
                        <AccordionTrigger className="text-sm font-semibold hover:text-blue-700">
                            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {t('rules.fairPlay.title')}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground prose dark:prose-invert">
                            <p>{t('rules.fairPlay.desc')}</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>{t('rules.fairPlay.points.p1')}</strong></li>
                                <li>{t('rules.fairPlay.points.p2')}</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3" className="border-none">
                        <AccordionTrigger className="text-sm font-semibold hover:text-blue-700">
                            <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> {t('rules.strategy.title')}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground prose dark:prose-invert">
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>{t('rules.strategy.points.p1')}</strong></li>
                                <li><strong>{t('rules.strategy.points.p2')}</strong></li>
                                <li>{t('rules.strategy.points.p3')}</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}

function GlobeIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}
