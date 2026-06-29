'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Oferta } from '@/types/red-solidaria';
import { CATEGORIA_EMOJI } from '@/types/red-solidaria';

interface Props {
  oferta: Oferta;
  distanciaKm?: number;
  onContactar?: () => void;
  onActualizada?: (id: string, cambios: Partial<Oferta>) => void;
  onEliminar?: (id: string) => void;
}

const ESTADO_COLOR: Record<string, string> = {
  disponible: 'bg-emerald-100 text-emerald-800',
  reservado:  'bg-amber-100 text-amber-800',
  entregado:  'bg-slate-100 text-slate-500',
};

export function TarjetaOferta({ oferta, distanciaKm, onContactar, onActualizada, onEliminar }: Props) {
  const { t } = useTranslation('red_solidaria');
  const [editando, setEditando]   = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');

  const toLocalDatetime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    descripcion:     oferta.descripcion,
    cantidad:        oferta.cantidad ?? '',
    sector:          oferta.sector,
    lat:             String(oferta.lat ?? ''),
    lng:             String(oferta.lng ?? ''),
    disponibleHasta: oferta.disponibleHasta ? toLocalDatetime(oferta.disponibleHasta) : '',
  });

  const fechaCreacion = oferta.creadoEn
    ? new Date(oferta.creadoEn).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
    : '';
  const fechaExpira = oferta.disponibleHasta
    ? new Date(oferta.disponibleHasta).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
    : '';

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        descripcion: form.descripcion,
        cantidad:    form.cantidad || null,
        sector:      form.sector,
      };
      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);
      if (!isNaN(lat) && !isNaN(lng)) { body.lat = lat; body.lng = lng; }
      if (form.disponibleHasta) {
        body.disponibleHasta = new Date(form.disponibleHasta).toISOString();
      }
      const res = await fetch(`/api/red-solidaria/ofertas/${oferta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al guardar');
      onActualizada?.(oferta.id, { ...body, disponibleHasta: body.disponibleHasta as string });
      setEditando(false);
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  if (editando) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{CATEGORIA_EMOJI[oferta.categoria]}</span>
          <span className="text-sm font-bold text-slate-700">{t(`categorias.${oferta.categoria}`)}</span>
          <span className="ml-auto text-xs text-slate-400">Editando</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Cantidad</label>
              <input
                type="text"
                value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
                placeholder="ej: 3 bolsas"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Sector / Dirección</label>
              <input
                type="text"
                value={form.sector}
                onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Disponible hasta</label>
            <input
              type="datetime-local"
              value={form.disponibleHasta}
              onChange={(e) => setForm((f) => ({ ...f, disponibleHasta: e.target.value }))}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Coordenadas GPS{' '}
              <span className="text-slate-400 font-normal">
                — búscalas en <a href="https://www.google.com/maps" target="_blank" rel="noopener" className="underline">Google Maps</a> (click derecho → copiar coordenadas)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                placeholder="Latitud ej: 10.4241"
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input
                type="text"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                placeholder="Longitud ej: -71.4407"
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Cabimas, Zulia → 10.4241, -71.4407</p>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={guardar}
              disabled={guardando}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
            >
              {guardando ? 'Guardando…' : '✓ Guardar cambios'}
            </button>
            <button
              onClick={() => { setEditando(false); setError(''); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-3xl shrink-0">{CATEGORIA_EMOJI[oferta.categoria]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLOR[oferta.estado]}`}>
              {t(`estados.${oferta.estado}`)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {t(`tarjetaOferta.${oferta.tipo === 'donacion' ? 'donacion' : 'solicitud'}`)}
            </span>
            {distanciaKm != null && (
              <span className="text-xs text-blue-600 font-medium">📍 {distanciaKm} km</span>
            )}
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => setEditando(true)}
                className="text-xs text-slate-400 hover:text-emerald-600 transition-colors px-1.5 py-0.5 rounded hover:bg-emerald-50"
                title="Editar oferta"
              >
                ✏️ Editar
              </button>
              {onEliminar && (
                <button
                  onClick={() => onEliminar(oferta.id)}
                  className="text-xs text-slate-400 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
                  title="Eliminar oferta"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {t(`categorias.${oferta.categoria}`)}
          </p>
          <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{oferta.descripcion}</p>
          {oferta.cantidad && (
            <p className="text-xs text-slate-500 mt-1">
              {t('tarjetaOferta.cantidad')}: {oferta.cantidad}
            </p>
          )}
          <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
            <div className="text-xs text-slate-400">
              📍 {oferta.sector}
              {fechaCreacion && <span className="ml-2">· {t('tarjetaOferta.publicado')} {fechaCreacion}</span>}
              {fechaExpira && <span className="ml-2">· {t('tarjetaOferta.expira')} {fechaExpira}</span>}
            </div>
            {oferta.estado === 'disponible' && onContactar && (
              <button
                onClick={onContactar}
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg min-h-[36px] transition-colors"
              >
                {oferta.tipo === 'donacion' ? t('tarjetaOferta.necesito') : t('tarjetaOferta.tengo')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
