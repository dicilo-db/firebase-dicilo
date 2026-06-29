'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIAS, CATEGORIA_EMOJI, type CategoriaAyuda } from '@/types/red-solidaria';
import { useGeolocalizacion } from '@/hooks/useGeolocalizacion';

// Venezuelan states with capital city coordinates
const ESTADOS_VE = [
  { nombre: 'Amazonas',         ciudad: 'Puerto Ayacucho', lat:  5.664, lng: -67.625 },
  { nombre: 'Anzoátegui',       ciudad: 'Barcelona',        lat: 10.131, lng: -64.686 },
  { nombre: 'Apure',            ciudad: 'San Fernando',     lat:  7.899, lng: -67.476 },
  { nombre: 'Aragua',           ciudad: 'Maracay',          lat: 10.247, lng: -67.596 },
  { nombre: 'Barinas',          ciudad: 'Barinas',          lat:  8.623, lng: -70.207 },
  { nombre: 'Bolívar',          ciudad: 'Ciudad Bolívar',   lat:  8.140, lng: -63.553 },
  { nombre: 'Carabobo',         ciudad: 'Valencia',         lat: 10.162, lng: -67.987 },
  { nombre: 'Cojedes',          ciudad: 'San Carlos',       lat:  9.658, lng: -68.594 },
  { nombre: 'Delta Amacuro',    ciudad: 'Tucupita',         lat:  9.063, lng: -62.053 },
  { nombre: 'Distrito Capital', ciudad: 'Caracas',          lat: 10.491, lng: -66.879 },
  { nombre: 'Falcón',           ciudad: 'Coro',             lat: 11.405, lng: -69.668 },
  { nombre: 'Guárico',          ciudad: 'Calabozo',         lat:  8.924, lng: -67.432 },
  { nombre: 'Lara',             ciudad: 'Barquisimeto',     lat: 10.063, lng: -69.357 },
  { nombre: 'Mérida',           ciudad: 'Mérida',           lat:  8.590, lng: -71.156 },
  { nombre: 'Miranda',          ciudad: 'Los Teques',       lat: 10.347, lng: -67.039 },
  { nombre: 'Monagas',          ciudad: 'Maturín',          lat:  9.745, lng: -63.183 },
  { nombre: 'Nueva Esparta',    ciudad: 'La Asunción',      lat: 11.034, lng: -63.870 },
  { nombre: 'Portuguesa',       ciudad: 'Guanare',          lat:  9.042, lng: -69.747 },
  { nombre: 'Sucre',            ciudad: 'Cumaná',           lat: 10.463, lng: -64.172 },
  { nombre: 'Táchira',          ciudad: 'San Cristóbal',    lat:  7.767, lng: -72.225 },
  { nombre: 'Trujillo',         ciudad: 'Trujillo',         lat:  9.367, lng: -70.439 },
  { nombre: 'Vargas',           ciudad: 'La Guaira',        lat: 10.601, lng: -67.036 },
  { nombre: 'Yaracuy',          ciudad: 'San Felipe',       lat: 10.339, lng: -68.739 },
  { nombre: 'Zulia',            ciudad: 'Maracaibo',        lat: 10.654, lng: -71.602 },
];

interface Props {
  tipoInicial?: 'donacion' | 'solicitud';
  onSuccess: (id: string, centrosCount?: number) => void;
  onCancel: () => void;
}

const PASO_TOTAL = 4;

export function FormularioOferta({ tipoInicial = 'donacion', onSuccess, onCancel }: Props) {
  const { t } = useTranslation('red_solidaria');
  const { pos, estado: geoEstado, error: geoError, obtener } = useGeolocalizacion();

  const [paso,     setPaso]     = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  const [form, setForm] = useState({
    tipo:             tipoInicial,
    categoria:        '' as CategoriaAyuda | '',
    descripcion:      '',
    cantidad:         '',
    estadoVE:         '',
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

  // When a Venezuelan state is selected, pre-fill coordinates
  const seleccionarEstado = (nombre: string) => {
    const estado = ESTADOS_VE.find((e) => e.nombre === nombre);
    if (estado) {
      setForm((f) => ({ ...f, estadoVE: nombre, lat: estado.lat, lng: estado.lng }));
    } else {
      setForm((f) => ({ ...f, estadoVE: '' }));
    }
  };

  // Override with GPS when available
  useEffect(() => {
    if (geoEstado === 'success' && pos) {
      setForm((f) => ({ ...f, lat: pos.lat, lng: pos.lng }));
    }
  }, [geoEstado, pos]);

  const siguientePaso = () => setPaso((p) => Math.min(p + 1, PASO_TOTAL));
  const anteriorPaso  = () => setPaso((p) => Math.max(p - 1, 1));

  const tieneUbicacion = form.lat !== 0 || form.estadoVE !== '';

  const puedeSiguiente = (): boolean => {
    if (paso === 1) return form.categoria !== '';
    if (paso === 2) return form.descripcion.trim().length >= 5;
    if (paso === 3) return form.sector.trim().length >= 2 && tieneUbicacion;
    if (paso === 4) return form.contactoWhatsapp.trim().length >= 7;
    return true;
  };

  const enviar = async () => {
    setEnviando(true);
    setErrorEnvio('');
    try {
      // Resolve final coordinates
      const lat = form.lat !== 0 ? form.lat : (ESTADOS_VE.find((e) => e.nombre === form.estadoVE)?.lat ?? 10.5);
      const lng = form.lng !== 0 ? form.lng : (ESTADOS_VE.find((e) => e.nombre === form.estadoVE)?.lng ?? -66.9);

      const [resOferta, resCentros] = await Promise.all([
        fetch('/api/red-solidaria/ofertas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo:             form.tipo,
            categoria:        form.categoria,
            descripcion:      form.descripcion,
            cantidad:         form.cantidad || undefined,
            lat,
            lng,
            sector:           form.estadoVE ? `${form.sector}, ${form.estadoVE}` : form.sector,
            contactoWhatsapp: form.contactoWhatsapp,
            disponibleHasta:  new Date(form.disponibleHasta).toISOString(),
          }),
        }),
        fetch('/api/red-solidaria/centros'),
      ]);

      const dataOferta = await resOferta.json();
      if (!resOferta.ok) throw new Error(dataOferta.error ?? t('formulario.error'));

      const dataCentros = resCentros.ok ? await resCentros.json() : { centros: [] };
      const centrosCount = dataCentros.centros?.filter((c: any) => c.verificado).length ?? 0;

      onSuccess(dataOferta.id, centrosCount);
    } catch (err: any) {
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const esDonacion = form.tipo === 'donacion';
  const tituloModal = esDonacion ? '📦 Publicar oferta de ayuda' : '🙏 Solicitar ayuda';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b border-slate-100 ${esDonacion ? 'bg-emerald-50' : 'bg-blue-50'}`}>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">{tituloModal}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {esDonacion ? 'Conecta tu donación con quien más la necesita' : 'Dinos qué necesitas y te conectamos con donantes'}
            </p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-3">✕</button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-5 pt-3 shrink-0">
          {Array.from({ length: PASO_TOTAL }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < paso
                  ? esDonacion ? 'bg-emerald-500' : 'bg-blue-500'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 px-5 pt-1 pb-0 shrink-0">
          {t('formulario.pasoDe', { paso, total: PASO_TOTAL })}
        </p>

        {/* Content - scrollable */}
        <div className="px-5 py-5 overflow-y-auto flex-1">

          {/* Paso 1: Categoría */}
          {paso === 1 && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                {esDonacion ? '¿Qué tienes para ofrecer?' : '¿Qué necesitas?'}
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                {esDonacion ? 'Selecciona la categoría que mejor describe tu donación' : 'Selecciona lo que más necesitas'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setField('categoria', cat)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all min-h-[72px] ${
                      form.categoria === cat
                        ? esDonacion
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-blue-500 bg-blue-50'
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
              <h3 className="font-semibold text-slate-800">
                {esDonacion ? 'Describe lo que donas' : 'Describe lo que necesitas'}
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  placeholder={esDonacion ? 'ej: Ropa de niño talla 4-6 años, buen estado' : 'ej: Necesito medicamentos para hipertensión'}
                  value={form.descripcion}
                  onChange={(e) => setField('descripcion', e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-slate-400 text-right mt-0.5">{form.descripcion.length}/500</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cantidad (opcional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="ej: 3 bolsas, 2 cajas, 1 caja"
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
              <h3 className="font-semibold text-slate-800">¿Dónde estás ubicado?</h3>
              <p className="text-xs text-slate-500">
                Necesitamos tu estado para conectarte con centros cercanos.
              </p>

              {/* State selector - primary method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estado venezolano *
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  value={form.estadoVE}
                  onChange={(e) => seleccionarEstado(e.target.value)}
                >
                  <option value="">— Selecciona tu estado —</option>
                  {ESTADOS_VE.map((e) => (
                    <option key={e.nombre} value={e.nombre}>
                      {e.nombre} ({e.ciudad})
                    </option>
                  ))}
                </select>
                {form.estadoVE && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ Ubicación: {form.estadoVE} — pin en {ESTADOS_VE.find(e => e.nombre === form.estadoVE)?.ciudad}
                  </p>
                )}
              </div>

              {/* Neighborhood/sector text */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sector / Barrio / Dirección *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="ej: La Colorada, Cabimas"
                  value={form.sector}
                  onChange={(e) => setField('sector', e.target.value)}
                  maxLength={200}
                />
              </div>

              {/* GPS optional refinement */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500 mb-2">Opcional: usa GPS para ubicación exacta</p>
                <button
                  onClick={obtener}
                  disabled={geoEstado === 'loading'}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-medium text-sm transition-colors min-h-[44px] ${
                    geoEstado === 'success'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {geoEstado === 'loading' ? '📡 Detectando...' :
                   geoEstado === 'success' ? '✅ GPS activo — ubicación exacta' :
                   '📍 Usar GPS (opcional)'}
                </button>
                {(geoEstado === 'error' || geoEstado === 'denied') && (
                  <p className="text-xs text-amber-600 mt-1">GPS no disponible — la ubicación del estado es suficiente</p>
                )}
              </div>
            </div>
          )}

          {/* Paso 4: Contacto + resumen */}
          {paso === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Contacto y publicación</h3>

              {/* Summary */}
              <div className={`rounded-xl p-3 text-sm space-y-1 ${esDonacion ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'}`}>
                <p className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-2">
                  {esDonacion ? '📦 Resumen de tu donación' : '🙏 Resumen de tu solicitud'}
                </p>
                <p>🏷️ <span className="font-medium">{CATEGORIA_EMOJI[form.categoria as CategoriaAyuda]} {t(`categorias.${form.categoria}`)}</span></p>
                <p>📝 {form.descripcion}</p>
                {form.cantidad && <p>📦 {form.cantidad}</p>}
                <p>📍 {form.sector}{form.estadoVE ? `, ${form.estadoVE}` : ''}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  WhatsApp de contacto *
                </label>
                <input
                  type="tel"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="+58 412 000 0000"
                  value={form.contactoWhatsapp}
                  onChange={(e) => setField('contactoWhatsapp', e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">🔒 Solo se comparte cuando hay un match confirmado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Disponible hasta
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={form.disponibleHasta}
                  onChange={(e) => setField('disponibleHasta', e.target.value)}
                />
              </div>

              {errorEnvio && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorEnvio}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          {paso > 1 && (
            <button
              onClick={anteriorPaso}
              className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 min-h-[48px]"
            >
              ← Atrás
            </button>
          )}
          {paso < PASO_TOTAL ? (
            <button
              onClick={siguientePaso}
              disabled={!puedeSiguiente()}
              className={`flex-1 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed py-3 text-sm font-semibold text-white min-h-[48px] transition-colors ${
                esDonacion ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={enviar}
              disabled={enviando || !puedeSiguiente()}
              className={`flex-1 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed py-3 text-sm font-semibold text-white min-h-[48px] transition-colors ${
                esDonacion ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {enviando ? '⏳ Publicando...' : esDonacion ? '✅ Publicar donación' : '✅ Publicar solicitud'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
