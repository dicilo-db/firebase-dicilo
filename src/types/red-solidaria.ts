export type CategoriaAyuda =
  | 'alimentos'
  | 'agua'
  | 'medicamentos'
  | 'ropa'
  | 'hogar'
  | 'herramientas'
  | 'transporte'
  | 'servicio_medico'
  | 'otro';

export type EstadoOferta = 'disponible' | 'reservado' | 'entregado';

export const CATEGORIA_EMOJI: Record<CategoriaAyuda, string> = {
  alimentos:       '🍚',
  agua:            '💧',
  medicamentos:    '💊',
  ropa:            '👕',
  hogar:           '🛋️',
  herramientas:    '🔧',
  transporte:      '🚗',
  servicio_medico: '🏥',
  otro:            '📦',
};

export const CATEGORIAS: CategoriaAyuda[] = [
  'alimentos', 'agua', 'medicamentos', 'ropa',
  'hogar', 'herramientas', 'transporte', 'servicio_medico', 'otro',
];

export interface Oferta {
  id: string;
  tipo: 'donacion' | 'solicitud';
  categoria: CategoriaAyuda;
  descripcion: string;
  cantidad?: string;
  lat: number;
  lng: number;
  sector: string;
  disponibleHasta: string; // ISO string
  estado: EstadoOferta;
  fotoUrl?: string;
  creadoEn: string; // ISO string
  centroAcopioId?: string;
}

export interface OfertaCreate extends Omit<Oferta, 'id' | 'creadoEn' | 'estado'> {
  contactoWhatsapp: string; // stored server-side only, never returned in GET
}

export interface CentroAcopio {
  id: string;
  nombre: string;
  direccion: string;
  sector: string;
  lat: number;
  lng: number;
  horario: string;
  responsable: string;
  verificado: boolean;
  necesidades: {
    categoria: CategoriaAyuda;
    descripcion: string;
    urgencia: 'alta' | 'media' | 'baja';
  }[];
  fotoUrl?: string;
  creadoEn: string;
}

export interface Match {
  id: string;
  ofertaId: string;
  centroId?: string;
  donanteLat: number;
  donanteLng: number;
  receptorLat: number;
  receptorLng: number;
  distanciaKm: number;
  estado: 'pendiente' | 'confirmado' | 'completado';
  notificadoEn: string;
}

export interface StatsRedSolidaria {
  ofertasActivas: number;
  centrosRegistrados: number;
  entregasCompletadas: number;
  personasAlcanzadas: number;
}
