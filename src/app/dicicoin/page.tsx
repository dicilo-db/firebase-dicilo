'use client';

import React from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DiciCoinPage() {
    const { t } = useTranslation('common');

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 md:py-16 space-y-16 max-w-5xl">

                {/* Section 1: Intro + Coin Image */}
                <section className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6 order-2 md:order-1 animate-in slide-in-from-left duration-700">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">{t('dicicoinPage.title')}</h1>
                        <div className="text-lg text-muted-foreground space-y-4 whitespace-pre-line leading-relaxed">
                            <p>{t('dicicoinPage.intro')}</p>
                            <p className="font-semibold text-foreground border-l-4 border-amber-500 pl-4 py-2 bg-amber-50/50 rounded-r-lg">
                                {t('dicicoinPage.unique')}
                            </p>
                        </div>
                    </div>
                    <div className="order-1 md:order-2 flex justify-center animate-in zoom-in duration-700">
                        <div className="relative w-64 h-64 md:w-80 md:h-80 shadow-2xl rounded-full overflow-hidden border-[6px] border-amber-500/30 ring-4 ring-white">
                            <Image
                                src="/images/dicicoin/coin.jpg"
                                alt="DiciCoin Coin"
                                fill
                                className="object-cover hover:scale-110 transition-transform duration-700"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: Why Special + Holding Image */}
                <section className="grid md:grid-cols-2 gap-8 items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="order-1 flex justify-center">
                        <div className="relative w-full max-w-sm aspect-[4/5] md:aspect-[4/3] shadow-lg rounded-2xl overflow-hidden group">
                            <Image
                                src="/images/dicicoin/holding.jpg"
                                alt="Holding DiciCoin"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <span className="text-white font-medium">Un símbolo de pertenencia</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6 order-2">
                        <h2 className="text-3xl font-bold text-primary">{t('dicicoinPage.specialTitle')}</h2>
                        <div className="text-lg text-muted-foreground space-y-4 whitespace-pre-line leading-relaxed">
                            {t('dicicoinPage.specialDesc')}
                        </div>
                    </div>
                </section>

                {/* Section 3: Text Blocks (How to + Message) */}
                <section className="grid md:grid-cols-2 gap-8 pt-4">
                    {/* How To Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-4 flex flex-col h-full">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{t('dicicoinPage.howToTitle')}</h3>
                        <div className="text-muted-foreground whitespace-pre-line leading-relaxed flex-grow">
                            {t('dicicoinPage.howToDesc')}
                        </div>
                    </div>

                    {/* Dark Message Card */}
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white space-y-6 flex flex-col justify-between h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>

                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-amber-400 mb-4">{t('dicicoinPage.messageTitle')}</h3>
                            <p className="text-slate-300 whitespace-pre-line leading-relaxed italic border-l-2 border-slate-700 pl-4">
                                {t('dicicoinPage.messageDesc')}
                            </p>
                        </div>

                        <div className="relative z-10 pt-6">
                            <Button asChild size="lg" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg h-14 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]">
                                <Link href="/registrieren">{t('dicicoinPage.cta')}</Link>
                            </Button>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
