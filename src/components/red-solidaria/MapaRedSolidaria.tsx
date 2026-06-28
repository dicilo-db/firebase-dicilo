'use client';
import { useEffect, useRef } from 'react';
import type { Oferta, CentroAcopio, CategoriaAyuda } from '@/types/red-solidaria';
import { CATEGORIA_EMOJI } from '@/types/red-solidaria';

interface Props {
  ofertas: Oferta[];
  centros: CentroAcopio[];
  mostrarOfertas: boolean;
  mostrarCentros: boolean;
  categoriaFiltro: CategoriaAyuda | 'todas';
  userLat?: number;
  userLng?: number;
  onOfertaClick?: (oferta: Oferta) => void;
  onCentroClick?: (centro: CentroAcopio) => void;
}

const ESTADO_COLOR: Record<string, string> = {
  disponible: '#059669',
  reservado:  '#d97706',
  entregado:  '#94a3b8',
};

export function MapaRedSolidaria({
  ofertas,
  centros,
  mostrarOfertas,
  mostrarCentros,
  categoriaFiltro,
  userLat,
  userLng,
  onOfertaClick,
  onCentroClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const layerOfertas = useRef<any>(null);
  const layerCentros = useRef<any>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    // cancelled prevents the async race in React StrictMode (double-invoke)
    let cancelled = false;

    const init = async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      if (!document.getElementById('leaflet-css-rs')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css-rs';
        link.rel  = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const map = L.map(containerRef.current, {
        center: [userLat ?? 8.0, userLng ?? -66.0],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      layerOfertas.current = L.layerGroup().addTo(map);
      layerCentros.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    };

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      layerOfertas.current = null;
      layerCentros.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update offer markers
  useEffect(() => {
    if (!mapRef.current || !layerOfertas.current) return;
    (async () => {
      const L = (await import('leaflet')).default;
      layerOfertas.current.clearLayers();

      if (!mostrarOfertas) return;

      const filtered = categoriaFiltro === 'todas'
        ? ofertas
        : ofertas.filter((o) => o.categoria === categoriaFiltro);

      filtered.forEach((oferta) => {
        const emoji  = CATEGORIA_EMOJI[oferta.categoria] ?? '📦';
        const color  = ESTADO_COLOR[oferta.estado] ?? '#059669';
        const icon   = L.divIcon({
          html: `<div style="background:${color};border-radius:50% 50% 50% 0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:14px">${emoji}</span></div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([oferta.lat, oferta.lng], { icon });
        marker.bindPopup(`
          <div style="min-width:180px;font-family:sans-serif">
            <div style="font-size:20px;margin-bottom:4px">${emoji}</div>
            <strong style="font-size:13px">${oferta.descripcion}</strong>
            <div style="color:#64748b;font-size:11px;margin-top:4px">📍 ${oferta.sector}</div>
            ${oferta.cantidad ? `<div style="color:#64748b;font-size:11px">Cantidad: ${oferta.cantidad}</div>` : ''}
            <div style="background:${color};color:white;font-size:10px;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:4px">
              ${oferta.estado}
            </div>
          </div>
        `);
        if (onOfertaClick) marker.on('click', () => onOfertaClick(oferta));
        layerOfertas.current.addLayer(marker);
      });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ofertas, mostrarOfertas, categoriaFiltro]);

  // Update center markers
  useEffect(() => {
    if (!mapRef.current || !layerCentros.current) return;
    (async () => {
      const L = (await import('leaflet')).default;
      layerCentros.current.clearLayers();

      if (!mostrarCentros) return;

      centros.forEach((centro) => {
        const icon = L.divIcon({
          html: `<div style="background:${centro.verificado ? '#2563eb' : '#94a3b8'};border-radius:50% 50% 50% 0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:18px">🏠</span></div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        const necesidadesList = centro.necesidades
          .slice(0, 3)
          .map((n) => `<li>${CATEGORIA_EMOJI[n.categoria]} ${n.categoria} <span style="color:${n.urgencia === 'alta' ? '#dc2626' : '#64748b'}">(${n.urgencia})</span></li>`)
          .join('');

        const marker = L.marker([centro.lat, centro.lng], { icon });
        marker.bindPopup(`
          <div style="min-width:200px;font-family:sans-serif">
            <strong style="font-size:13px">🏠 ${centro.nombre}</strong>
            ${centro.verificado ? '<span style="background:#dbeafe;color:#1d4ed8;font-size:10px;padding:1px 5px;border-radius:3px;margin-left:4px">✓ Verificado</span>' : ''}
            <div style="color:#64748b;font-size:11px;margin-top:4px">📍 ${centro.sector}</div>
            ${centro.horario ? `<div style="color:#64748b;font-size:11px">🕐 ${centro.horario}</div>` : ''}
            ${necesidadesList ? `<div style="font-size:11px;margin-top:4px;font-weight:600">Necesidades:</div><ul style="font-size:11px;margin:2px 0 0 12px;padding:0">${necesidadesList}</ul>` : ''}
          </div>
        `);
        if (onCentroClick) marker.on('click', () => onCentroClick(centro));
        layerCentros.current.addLayer(marker);
      });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centros, mostrarCentros]);

  // Center on user
  useEffect(() => {
    if (!mapRef.current || userLat == null || userLng == null) return;
    mapRef.current.setView([userLat, userLng], 12);
  }, [userLat, userLng]);

  return (
    <div
      ref={containerRef}
      style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}
    />
  );
}
