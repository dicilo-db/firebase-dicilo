'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { TarjetaOferta } from '@/components/red-solidaria/TarjetaOferta';
import { TarjetaCentro } from '@/components/red-solidaria/TarjetaCentro';
import { useGeolocalizacion } from '@/hooks/useGeolocalizacion';
import type { Oferta, CentroAcopio, CategoriaAyuda } from '@/types/red-solidaria';
import { CATEGORIAS, CATEGORIA_EMOJI } from '@/types/red-solidaria';

// Componentes que usan APIs del navegador (Leaflet, GPS, fetch) — solo cliente
const ContadoresLive = dynamic(
  () => import('@/components/red-solidaria/ContadoresLive').then((m) => m.ContadoresLive),
  { ssr: false, loading: () => <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-20 animate-pulse bg-slate-100 rounded-xl" /> }
);
const MapaRedSolidaria = dynamic(
  () => import('@/components/red-solidaria/MapaRedSolidaria').then((m) => m.MapaRedSolidaria),
  { ssr: false, loading: () => <div className="h-[400px] bg-slate-100 animate-pulse rounded-xl" /> }
);
const FormularioOferta = dynamic(
  () => import('@/components/red-solidaria/FormularioOferta').then((m) => m.FormularioOferta),
  { ssr: false }
);

export default function RedSolidariaPage() {
  const { t, i18n } = useTranslation('red_solidaria');
  const { pos, obtener } = useGeolocalizacion();

  const [ofertas,       setOfertas]       = useState<Oferta[]>([]);
  const [centros,       setCentros]       = useState<CentroAcopio[]>([]);
  const [cargando,      setCargando]      = useState(true);
  const [mostrarForm,   setMostrarForm]   = useState(false);
  const [exito,         setExito]         = useState('');
  const [mostrarOfertas,setMostrarOfertas]= useState(true);
  const [mostrarCentros,setMostrarCentros]= useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaAyuda | 'todas'>('todas');
  const [vistaActiva,   setVistaActiva]   = useState<'mapa' | 'lista'>('mapa');

  const esIdiomaNativo = i18n.language?.startsWith('es');

  useEffect(() => {
    const load = async () => {
      setCargando(true);
      try {
        const [resO, resC] = await Promise.all([
          fetch('/api/red-solidaria/ofertas'),
          fetch('/api/red-solidaria/centros'),
        ]);
        const dataO = await resO.json();
        const dataC = await resC.json();
        if (dataO.ofertas) setOfertas(dataO.ofertas);
        if (dataC.centros) setCentros(dataC.centros);
      } catch { /* silent */ } finally {
        setCargando(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const ofertasFiltradas = categoriaFiltro === 'todas'
    ? ofertas
    : ofertas.filter((o) => o.categoria === categoriaFiltro);

  const handleExito = (id: string) => {
    setMostrarForm(false);
    setExito(t('formulario.exito'));
    setTimeout(() => setExito(''), 6000);
  };

  const handleActualizada = (id: string, cambios: Partial<Oferta>) => {
    setOfertas((prev) => prev.map((o) => o.id === id ? { ...o, ...cambios } as Oferta : o));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      {/* Venezuelan flag stripe */}
      <div className="flex h-1.5 w-full">
        <div className="flex-1 bg-[#F4C700]" />
        <div className="flex-1 bg-[#002B7F]" />
        <div className="flex-1 bg-[#CF142B]" />
      </div>

      {/* Section navigation tabs */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full max-w-4xl mx-auto px-4 flex">
          <Link
            href="/la-comunidad/apoyo-vzla"
            className="flex-1 py-3 text-center text-sm font-medium text-slate-500 hover:text-slate-700 border-b-2 border-transparent hover:border-slate-300 transition-colors"
          >
            ❤️ {t('nav.campana')}
          </Link>
          <div className="flex-1 py-3 text-center text-sm font-bold text-emerald-700 border-b-2 border-emerald-500">
            🤝 {t('nav.redSolidaria')}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">

        {/* Language warning */}
        {!esIdiomaNativo && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-2 items-start">
            <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">{t('langWarning.title')}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t('langWarning.desc')}</p>
              <Link href="/la-comunidad/apoyo-vzla?lang=es" className="text-xs text-amber-700 underline mt-1 inline-block">
                Ver en español →
              </Link>
            </div>
          </div>
        )}

        {/* Success toast */}
        {exito && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800">
            ✅ {exito}
          </div>
        )}

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 p-6 sm:p-10 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300 mb-4">
            🤝 {t('hero.badge')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            {t('hero.title')} <span className="text-[#F4C700]">🇻🇪</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mb-6">
            {t('hero.desc')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMostrarForm(true)}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-bold text-white min-h-[48px] transition-colors shadow-lg"
            >
              📦 {t('hero.btnDonar')}
            </button>
            <button
              onClick={() => setMostrarForm(true)}
              className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 px-5 py-3 text-sm font-semibold text-white min-h-[48px] transition-colors"
            >
              🙏 {t('hero.btnNecesitar')}
            </button>
          </div>
        </div>

        {/* Live counters */}
        <ContadoresLive />

        {/* Map controls */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-slate-800 text-sm">{t('mapa.title')}</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setVistaActiva('mapa')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${vistaActiva === 'mapa' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                🗺️ Mapa
              </button>
              <button
                onClick={() => setVistaActiva('lista')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${vistaActiva === 'lista' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                📋 Lista
              </button>
            </div>
          </div>

          {/* Layer toggles */}
          <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarOfertas}
                onChange={(e) => setMostrarOfertas(e.target.checked)}
                className="accent-emerald-500"
              />
              <span className="font-medium">📦 {t('mapa.ofertas')}</span>
              <span className="text-slate-400">({ofertasFiltradas.length})</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarCentros}
                onChange={(e) => setMostrarCentros(e.target.checked)}
                className="accent-blue-500"
              />
              <span className="font-medium">🏠 {t('mapa.centros')}</span>
              <span className="text-slate-400">({centros.length})</span>
            </label>
          </div>

          {/* Category filter pills */}
          <div className="px-4 py-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-hide pb-3">
            <button
              onClick={() => setCategoriaFiltro('todas')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoriaFiltro === 'todas' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {t('mapa.todas')}
            </button>
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoriaFiltro === cat ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {CATEGORIA_EMOJI[cat]} {t(`categorias.${cat}`)}
              </button>
            ))}
          </div>

          {/* Map or list view */}
          {vistaActiva === 'mapa' ? (
            <div className="p-2">
              <MapaRedSolidaria
                ofertas={ofertas}
                centros={centros}
                mostrarOfertas={mostrarOfertas}
                mostrarCentros={mostrarCentros}
                categoriaFiltro={categoriaFiltro}
                userLat={pos?.lat}
                userLng={pos?.lng}
              />
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cargando && (
                <div className="text-center text-sm text-slate-400 py-8">Cargando...</div>
              )}
              {!cargando && ofertasFiltradas.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-8">{t('mapa.sinOfertas')}</div>
              )}
              {ofertasFiltradas.map((oferta) => (
                <TarjetaOferta key={oferta.id} oferta={oferta} onActualizada={handleActualizada} />
              ))}
              {mostrarCentros && centros.map((centro) => (
                <TarjetaCentro key={centro.id} centro={centro} />
              ))}
            </div>
          )}
        </div>

        {/* Privacy note */}
        <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-xs text-slate-500">
          🔒 {t('privacidad.nota')}
        </div>

        {/* Back link */}
        <div className="text-center text-sm pb-4">
          <Link href="/la-comunidad/apoyo-vzla" className="text-slate-600 hover:text-emerald-700 underline underline-offset-2">
            {t('backLink')}
          </Link>
        </div>

      </main>

      <Footer />

      {/* Formulario modal */}
      {mostrarForm && (
        <FormularioOferta
          onSuccess={handleExito}
          onCancel={() => setMostrarForm(false)}
        />
      )}

      {/* Floating CTA (mobile) */}
      {!mostrarForm && (
        <div className="fixed bottom-6 right-4 z-40 sm:hidden">
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-2 rounded-full bg-emerald-600 text-white px-5 py-3.5 font-bold text-sm shadow-xl hover:bg-emerald-500 transition-colors"
          >
            + {t('hero.btnDonar')}
          </button>
        </div>
      )}
    </div>
  );
}
