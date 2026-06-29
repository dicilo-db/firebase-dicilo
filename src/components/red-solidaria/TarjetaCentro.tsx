'use client';
import { useTranslation } from 'react-i18next';
import type { CentroAcopio } from '@/types/red-solidaria';
import { CATEGORIA_EMOJI } from '@/types/red-solidaria';

interface Props {
  centro: CentroAcopio;
  distanciaKm?: number;
  onEliminar?: (id: string) => void;
}

const URGENCIA_COLOR: Record<string, string> = {
  alta:  'text-red-600 font-bold',
  media: 'text-amber-600 font-semibold',
  baja:  'text-slate-500',
};

export function TarjetaCentro({ centro, distanciaKm, onEliminar }: Props) {
  const { t } = useTranslation('red_solidaria');

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-3xl shrink-0">🏠</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {centro.verificado ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                ✓ {t('tarjetaCentro.verificado')}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                ⏳ {t('tarjetaCentro.noVerificado')}
              </span>
            )}
            {distanciaKm != null && (
              <span className="text-xs text-blue-600 font-medium">📍 {distanciaKm} km</span>
            )}
            {onEliminar && (
              <button
                onClick={() => onEliminar(centro.id)}
                className="ml-auto text-xs text-slate-400 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
                title="Eliminar centro"
              >
                🗑️
              </button>
            )}
          </div>
          <p className="text-sm font-bold text-slate-800">{centro.nombre}</p>
          <p className="text-xs text-slate-500 mt-0.5">📍 {centro.sector}</p>
          {centro.horario && (
            <p className="text-xs text-slate-500">🕐 {centro.horario}</p>
          )}
          {centro.necesidades.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-slate-600 mb-1">{t('tarjetaCentro.necesidades')}:</p>
              <div className="flex flex-wrap gap-1">
                {centro.necesidades.slice(0, 4).map((n, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 ${URGENCIA_COLOR[n.urgencia]}`}
                  >
                    {CATEGORIA_EMOJI[n.categoria]} {t(`categorias.${n.categoria}`)}
                    {n.urgencia === 'alta' && ' ⚠️'}
                  </span>
                ))}
                {centro.necesidades.length > 4 && (
                  <span className="text-xs text-slate-400 px-1">+{centro.necesidades.length - 4}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
