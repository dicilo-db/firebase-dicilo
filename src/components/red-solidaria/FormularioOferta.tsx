'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIAS, CATEGORIA_EMOJI, type CategoriaAyuda } from '@/types/red-solidaria';
import { useGeolocalizacion } from '@/hooks/useGeolocalizacion';

interface Props {
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

const PASO_TOTAL = 4;

export function FormularioOferta({ onSuccess, onCancel }: Props) {
  const { t } = useTranslation('red_solidaria');
  const { pos, estado: geoEstado, error: geoError, obtener } = useGeolocalizacion();

  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  const [form, setForm] = useState({
    tipo:             'donacion' as 'donacion' | 'solicitud',
    categoria:        '' as CategoriaAyuda | '',
    descripcion:      '',
    cantidad:         '',
    lat:              0,
    lng:              0,
    sector:           '',
    contactoWhatsapp: '',
    disponibleHasta:  (() => {
      const d = new Date();
      d.setHours(d.getHours() + 72);
      return d.toISOString().slice(0, 16);
    })(),
  });

  const setField = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const siguientePaso = () => setPaso((p) => Math.min(p + 1, PASO_TOTAL));
  const anteriorPaso  = () => setPaso((p) => Math.max(p - 1, 1));

  // Sync GPS position to form when detected
  useEffect(() => {
    if (geoEstado === 'success' && pos && form.lat === 0) {
      setForm((f) => ({ ...f, lat: pos.lat, lng: pos.lng }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoEstado, pos]);

  const usarGPS = () => {
    obtener();
  };

  const puedeSiguiente = (): boolean => {
    if (paso === 1) return form.categoria !== '';
    if (paso === 2) return form.descripcion.trim().length >= 5;
    if (paso === 3) return form.sector.trim().length >= 2 && (form.lat !== 0 || form.sector.length > 3);
    if (paso === 4) return form.contactoWhatsapp.trim().length >= 7;
    return true;
  };

  const enviar = async () => {
    setEnviando(true);
    setErrorEnvio('');
    try {
      const res = await fetch('/api/red-solidaria/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lat: form.lat || 10.5,  // fallback to center of Venezuela if no GPS
          lng: form.lng || -66.9,
          disponibleHasta: new Date(form.disponibleHasta).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('formulario.error'));
      onSuccess(data.id);
    } catch (err: any) {
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{t('formulario.titulo')}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-5 pt-3">
          {Array.from({ length: PASO_TOTAL }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i < paso ? 'bg-emerald-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 px-5 pt-1 pb-0">
          {t('formulario.pasoDe', { paso, total: PASO_TOTAL })}
        </p>

        {/* Content */}
        <div className="px-5 py-5 min-h-[260px]">
          {/* Paso 1: Categoría */}
          {paso === 1 && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">{t('formulario.paso1.titulo')}</h3>
              <p className="text-xs text-slate-500 mb-3">{t('formulario.paso1.subtitulo')}</p>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setField('categoria', cat)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all min-h-[72px] ${
                      form.categoria === cat
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">{CATEGORIA_EMOJI[cat]}</span>
                    <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                      {t(`categorias.${cat}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: Descripción */}
          {paso === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">{t('formulario.paso2.titulo')}</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('formulario.paso2.descripcion')} *
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  placeholder={t('formulario.paso2.descripcionPlaceholder')}
                  value={form.descripcion}
                  onChange={(e) => setField('descripcion', e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-slate-400 text-right mt-0.5">{form.descripcion.length}/500</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('formulario.paso2.cantidad')}
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder={t('formulario.paso2.cantidadPlaceholder')}
                  value={form.cantidad}
                  onChange={(e) => setField('cantidad', e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>
          )}

          {/* Paso 3: Ubicación */}
          {paso === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">{t('formulario.paso3.titulo')}</h3>
              <button
                onClick={usarGPS}
                disabled={geoEstado === 'loading'}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-medium text-sm transition-colors min-h-[48px] ${
                  geoEstado === 'success'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-900 text-white hover:bg-slate-700'
                }`}
              >
                {geoEstado === 'loading' ? '📡 Detectando...' :
                 geoEstado === 'success' ? `✅ ${t('formulario.paso3.gpsActivo')}` :
                 `📍 ${t('formulario.paso3.usarGPS')}`}
              </button>
              {(geoEstado === 'error' || geoEstado === 'denied') && (
                <p className="text-xs text-amber-600">{geoError ?? t('formulario.paso3.gpsError')}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('formulario.paso3.sector')} *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder={t('formulario.paso3.sectorPlaceholder')}
                  value={form.sector}
                  onChange={(e) => setField('sector', e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
          )}

          {/* Paso 4: Disponibilidad + WhatsApp */}
          {paso === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">{t('formulario.paso4.titulo')}</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('formulario.paso4.tipo')}
                </label>
                <div className="flex gap-2">
                  {(['donacion', 'solicitud'] as const).map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setField('tipo', tipo)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors min-h-[48px] ${
                        form.tipo === tipo
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {tipo === 'donacion' ? `📦 ${t('formulario.paso4.tipoDonacion')}` : `🙏 ${t('formulario.paso4.tipoSolicitud')}`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('formulario.paso4.disponibleHasta')}
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={form.disponibleHasta}
                  onChange={(e) => setField('disponibleHasta', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('formulario.paso4.whatsapp')} *
                </label>
                <input
                  type="tel"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder={t('formulario.paso4.whatsappPlaceholder')}
                  value={form.contactoWhatsapp}
                  onChange={(e) => setField('contactoWhatsapp', e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">🔒 {t('formulario.paso4.whatsappNote')}</p>
              </div>
              {errorEnvio && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorEnvio}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
          {paso > 1 && (
            <button
              onClick={anteriorPaso}
              className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 min-h-[48px]"
            >
              {t('formulario.anterior')}
            </button>
          )}
          {paso < PASO_TOTAL ? (
            <button
              onClick={siguientePaso}
              disabled={!puedeSiguiente()}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed py-3 text-sm font-semibold text-white min-h-[48px] transition-colors"
            >
              {t('formulario.siguiente')}
            </button>
          ) : (
            <button
              onClick={enviar}
              disabled={enviando || !puedeSiguiente()}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed py-3 text-sm font-semibold text-white min-h-[48px] transition-colors"
            >
              {enviando ? t('formulario.publicando') : t('formulario.publicar')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
