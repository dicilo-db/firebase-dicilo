'use client';
import { useTranslation } from 'react-i18next';
import type { Oferta } from '@/types/red-solidaria';
import { CATEGORIA_EMOJI } from '@/types/red-solidaria';

interface Props {
  oferta: Oferta;
  distanciaKm?: number;
  onContactar?: () => void;
}

const ESTADO_COLOR: Record<string, string> = {
  disponible: 'bg-emerald-100 text-emerald-800',
  reservado:  'bg-amber-100 text-amber-800',
  entregado:  'bg-slate-100 text-slate-500',
};

export function TarjetaOferta({ oferta, distanciaKm, onContactar }: Props) {
  const { t } = useTranslation('red_solidaria');

  const fechaCreacion = oferta.creadoEn
    ? new Date(oferta.creadoEn).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
    : '';
  const fechaExpira = oferta.disponibleHasta
    ? new Date(oferta.disponibleHasta).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
    : '';

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
