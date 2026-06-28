import type { Oferta, CentroAcopio, Match } from '@/types/red-solidaria';

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const URGENCIA_PESO: Record<string, number> = { alta: 3, media: 2, baja: 1 };

export function findMatches(
  oferta: Oferta,
  centros: CentroAcopio[],
  radioKm = 10
): Array<{ centro: CentroAcopio; distanciaKm: number; score: number }> {
  const resultados = centros
    .filter((c) => c.verificado)
    .map((centro) => {
      const distanciaKm = haversineKm(oferta.lat, oferta.lng, centro.lat, centro.lng);
      if (distanciaKm > radioKm) return null;

      const necesidadMatch = centro.necesidades.find(
        (n) => n.categoria === oferta.categoria
      );
      if (!necesidadMatch) return null;

      const score =
        (URGENCIA_PESO[necesidadMatch.urgencia] ?? 1) * 10 +
        Math.max(0, radioKm - distanciaKm); // closer = higher score

      return { centro, distanciaKm: Math.round(distanciaKm * 10) / 10, score };
    })
    .filter(Boolean) as Array<{ centro: CentroAcopio; distanciaKm: number; score: number }>;

  return resultados.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function buildMatchObject(
  oferta: Oferta,
  centro: CentroAcopio,
  distanciaKm: number
): Omit<Match, 'id'> {
  return {
    ofertaId: oferta.id,
    centroId: centro.id,
    donanteLat: oferta.lat,
    donanteLng: oferta.lng,
    receptorLat: centro.lat,
    receptorLng: centro.lng,
    distanciaKm,
    estado: 'pendiente',
    notificadoEn: new Date().toISOString(),
  };
}
