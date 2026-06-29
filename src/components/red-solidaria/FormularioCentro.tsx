'use client';
import { useState } from 'react';
import { CATEGORIAS, CATEGORIA_EMOJI, type CategoriaAyuda } from '@/types/red-solidaria';

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
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormularioCentro({ onSuccess, onCancel }: Props) {
  const [paso,      setPaso]      = useState<'form' | 'exito'>('form');
  const [enviando,  setEnviando]  = useState(false);
  const [error,     setError]     = useState('');

  const [form, setForm] = useState({
    nombre:   '',
    estadoVE: '',
    sector:   '',
    horario:  '',
    telefono: '',
    capacidad: '',
  });
  const [necesidades, setNecesidades] = useState<CategoriaAyuda[]>([]);

  const setField = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleNecesidad = (cat: CategoriaAyuda) => {
    setNecesidades((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const estadoObj = ESTADOS_VE.find((e) => e.nombre === form.estadoVE);

  const puedeSiguiente =
    form.nombre.trim().length >= 3 &&
    form.estadoVE !== '' &&
    form.sector.trim().length >= 3 &&
    form.telefono.trim().length >= 7 &&
    necesidades.length > 0;

  const enviar = async () => {
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/red-solidaria/centros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:    form.nombre,
          sector:    `${form.sector}, ${form.estadoVE}`,
          lat:       estadoObj?.lat ?? 10.5,
          lng:       estadoObj?.lng ?? -66.9,
          horario:   form.horario || undefined,
          telefono:  form.telefono,
          capacidad: form.capacidad || undefined,
          necesidades: necesidades.map((cat) => ({ categoria: cat, urgencia: 'media' })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al registrar');
      setPaso('exito');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (paso === 'exito') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
        <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">¡Centro registrado!</h2>
          <p className="text-slate-600 text-sm mb-2">
            Tu solicitud fue recibida. El equipo de Dicilo verificará los datos del centro
            en las próximas <strong>24 horas</strong> y aparecerá en el mapa una vez verificado.
          </p>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 mb-6 text-left">
            <p className="font-semibold mb-1">⏳ Proceso de verificación</p>
            <p className="text-xs">Verificamos cada centro para garantizar que la ayuda llegue de forma segura. Te contactaremos al número registrado.</p>
          </div>
          <button
            onClick={onSuccess}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Entendido ✓
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-blue-50 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">🏠 Registrar Centro de Acopio</h2>
            <p className="text-xs text-slate-500 mt-0.5">El centro será verificado por el equipo Dicilo antes de aparecer en el mapa</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-3">✕</button>
        </div>

        {/* Form - scrollable */}
        <div className="px-5 py-5 overflow-y-auto flex-1 space-y-4">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del centro *</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="ej: Centro Comunitario La Esperanza"
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado venezolano *</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={form.estadoVE}
              onChange={(e) => setField('estadoVE', e.target.value)}
            >
              <option value="">— Selecciona el estado —</option>
              {ESTADOS_VE.map((e) => (
                <option key={e.nombre} value={e.nombre}>{e.nombre} ({e.ciudad})</option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sector / Dirección *</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="ej: Av. Principal de Chacao, local 5"
              value={form.sector}
              onChange={(e) => setField('sector', e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Horario + Capacidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Horario</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ej: Lun-Vie 8am-5pm"
                value={form.horario}
                onChange={(e) => setField('horario', e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ej: 500 familias/semana"
                value={form.capacidad}
                onChange={(e) => setField('capacidad', e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Teléfono de contacto *</label>
            <input
              type="tel"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="+58 412 000 0000"
              value={form.telefono}
              onChange={(e) => setField('telefono', e.target.value)}
            />
          </div>

          {/* Necesidades */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">¿Qué categorías recibe el centro? * <span className="text-slate-400 font-normal">(selecciona al menos una)</span></label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleNecesidad(cat)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all min-h-[60px] ${
                    necesidades.includes(cat)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{CATEGORIA_EMOJI[cat]}</span>
                  <span className="text-xs font-medium text-slate-700 text-center leading-tight">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Verificación notice */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600">
            <p className="font-semibold mb-1">ℹ️ Proceso de verificación</p>
            <p>Dicilo verificará los datos del centro antes de publicarlo en el mapa. Recibirás confirmación al número registrado en un plazo de 24h.</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 min-h-[48px]"
          >
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={enviando || !puedeSiguiente}
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed py-3 text-sm font-semibold text-white min-h-[48px] transition-colors"
          >
            {enviando ? '⏳ Registrando...' : '🏠 Registrar centro'}
          </button>
        </div>
      </div>
    </div>
  );
}
