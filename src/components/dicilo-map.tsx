// src/components/dicilo-map.tsx
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
// Importamos L.latLng y LatLngTuple para la validación más estricta de Leaflet
import L, { Map as LeafletMap, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Business {
  id: string;
  name: string;
  coords?: [number, number];
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  clientSlug?: string;
  currentOfferUrl?: string;
  mapUrl?: string;
}

interface DiciloMapProps {
  center: [number, number];
  zoom: number;
  businesses: Business[];
  selectedBusinessId?: string | null;
  onMarkerDragEnd?: (newCoords: [number, number]) => void;
  t: (key: string, options?: any) => string;
}

// VALOR POR DEFECTO: Si el 'center' inicial está corrupto, volamos a un centro por defecto (Ej: Alemania Central)
const DEFAULT_CENTER: LatLngTuple = [50.1109, 8.6821]; 
const DEFAULT_ZOOM = 10;

// Helper para enviar eventos a la API de analíticas
const logAnalyticsEvent = async (eventData: object) => {
  try {
    await fetch('/api/analytics/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
};

const fixLeafletDefaultIcons = () => {
  if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }
};

const createPopupContent = (
  business: Business,
  t: DiciloMapProps['t']
): string => {
  let content = `<h3>${business.name}</h3>`;

  if (business.category) {
    content += `<p><strong>${business.category.replace(' / ', ' &middot; ')}</strong></p>`;
  }
  if (business.address) {
    content += `<p>${business.address}</p>`;
  }
  if (business.phone) {
    content += `<p>${business.phone}</p>`;
  }

  const links = [];
  if (business.website) {
    links.push(
      `<a href="${business.website}" target="_blank" rel="noopener noreferrer" data-analytics-business-id="${business.id}" data-analytics-business-name="${business.name}" data-analytics-type="website">${t('mapPopup.website')}</a>`
    );
  }

  const offerUrl = business.clientSlug
    ? `/client/${business.clientSlug}`
    : business.currentOfferUrl;
  if (offerUrl) {
    links.push(
      `<a href="${offerUrl}" target="_blank" rel="noopener noreferrer" data-analytics-business-id="${business.id}" data-analytics-business-name="${business.name}" data-analytics-type="offer">${t('mapPopup.offer')}</a>`
    );
  }

  if (business.mapUrl) {
    links.push(
      `<a href="${business.mapUrl}" target="_blank" rel="noopener noreferrer" data-analytics-business-id="${business.id}" data-analytics-business-name="${business.name}" data-analytics-type="map">${t('mapPopup.map')}</a>`
    );
  }

  if (links.length > 0) {
    content += `<p>${links.join(' <span style="color:hsl(var(--primary)); font-weight: bold;">|</span> ')}</p>`;
  }

  return content;
};

// Función de validación y conversión robusta
const validateAndParseCoords = (coords: any): LatLngTuple | null => {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return null;
  }
  
  // Usar parseFloat(String(x)) para la conversión más robusta 
  const lat = parseFloat(String(coords[0]));
  const lng = parseFloat(String(coords[1]));

  if (isFinite(lat) && isFinite(lng)) {
    return [lat, lng];
  }

  console.error(
    'DICILO_MAP_ERROR: Coordenadas inválidas detectadas y bloqueadas en useMemo:',
    coords
  );
  return null;
};

const DiciloMap: React.FC<DiciloMapProps> = ({
  center,
  zoom,
  businesses,
  selectedBusinessId,
  onMarkerDragEnd,
  t,
}) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Nivel 1: Saneamiento de la lista de datos
  const businessesWithCoords = useMemo(() => {
    return businesses
      .map((business) => {
        const validCoords = validateAndParseCoords(business.coords);
        if (!validCoords) {
          return null; // Descartar negocio si las coordenadas son inválidas
        }
        return {
          ...business,
          coords: validCoords, // Sobrescribir con coordenadas validadas y tipadas como LatLngTuple
        };
      })
      .filter((b): b is Business & { coords: LatLngTuple } => b !== null);
  }, [businesses]);

  useEffect(() => {
    fixLeafletDefaultIcons();
  }, []);

  // Efecto para manejar los clics en los popups para analíticas
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' &&
        target.hasAttribute('data-analytics-type')
      ) {
        const businessId = target.getAttribute('data-analytics-business-id');
        const businessName = target.getAttribute(
          'data-analytics-business-name'
        );
        const clickedElement = target.getAttribute('data-analytics-type');

        if (businessId && businessName && clickedElement) {
          logAnalyticsEvent({
            type: 'popupClick',
            businessId,
            businessName,
            clickedElement,
          });
        }
      }
    };

    const popupOpenHandler = (e: L.PopupEvent) => {
      e.popup.getElement()?.addEventListener('click', handlePopupClick);
    };

    const popupCloseHandler = (e: L.PopupEvent) => {
      e.popup.getElement()?.removeEventListener('click', handlePopupClick);
    };

    map.on('popupopen', popupOpenHandler);
    map.on('popupclose', popupCloseHandler);

    return () => {
      map.off('popupopen', popupOpenHandler);
      map.off('popupclose', popupCloseHandler);
    };
  }, []);

  // Nivel 2: Saneamiento de la inicialización del mapa (setView)
  useEffect(() => {
    const currentMapContainer = mapContainerRef.current;
    if (!currentMapContainer) return;
    
    // Verificación del centro inicial de la prop
    const isCenterValid = isFinite(center[0]) && isFinite(center[1]);
    const safeCenter: LatLngTuple = isCenterValid ? center : DEFAULT_CENTER;

    if (!mapRef.current) {
      // Inicialización del mapa
      try {
        const map = L.map(currentMapContainer, {
          zoomControl: true,
          attributionControl: true,
        }).setView(safeCenter, zoom); // Usamos safeCenter
  
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 20,
        }).addTo(map);
  
        mapRef.current = map;
  
        const ro = new ResizeObserver(() => {
          map.invalidateSize();
        });
        ro.observe(currentMapContainer);
        resizeObserverRef.current = ro;
      } catch (e) {
        console.error("DICILO_MAP_INIT_CRASH_PREVENTED: Fallo al inicializar el mapa con setView.", e);
        // Retornar sin asignar mapRef.current para evitar errores posteriores
        return;
      }
    } else {
      // Actualización del mapa existente
      if (isCenterValid) {
        mapRef.current.setView(center, zoom);
      } else {
        mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }
    }

    return () => {
      if (resizeObserverRef.current && currentMapContainer) {
        resizeObserverRef.current.unobserve(currentMapContainer);
      }
    };
  }, [center, zoom]);

  // Nivel 3: Saneamiento de la creación de marcadores
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const displayedMarkerIds = new Set(markersRef.current.keys());
    const businessesToDisplayIds = new Set(
      businessesWithCoords.map((b) => b.id)
    );

    // Eliminar marcadores que ya no están en la lista
    displayedMarkerIds.forEach((id) => {
      if (!businessesToDisplayIds.has(id)) {
        markersRef.current.get(id)?.remove();
        markersRef.current.delete(id);
      }
    });

    // Añadir o actualizar marcadores
    businessesWithCoords.forEach((business) => {
      try { // TRY-CATCH para blindar la creación de cada marcador
        const popupContent = createPopupContent(business, t);
        let marker = markersRef.current.get(business.id);

        // Crear una tupla fresca y usar L.latLng para máxima seguridad
        const latLng = L.latLng(
            parseFloat(String(business.coords[0])), 
            parseFloat(String(business.coords[1]))
        );
        
        if (marker) {
          // Usar setLatLng() con L.LatLng objeto nativo para evitar problemas de referencia
          marker.setLatLng(latLng);
          marker.getPopup()?.setContent(popupContent);
        } else {
          // CRÍTICO: Usar L.latLng objeto en lugar de array crudo
          marker = L.marker(latLng, { 
            draggable: !!onMarkerDragEnd,
          })
            .addTo(map)
            .bindPopup(popupContent);

          if (onMarkerDragEnd) {
            marker.on('dragend', function (event) {
              const newLatLng = event.target.getLatLng();
              onMarkerDragEnd([newLatLng.lat, newLatLng.lng]);
            });
          }

          markersRef.current.set(business.id, marker);
        }
      } catch (e) {
        console.error("DICILO_MAP_MARKER_CRASH_PREVENTED: Fallo al crear o actualizar marcador:", business.id, e);
      }
    });
  }, [businessesWithCoords, onMarkerDragEnd, t]);

  // El bloque de flyTo que ya habíamos corregido (ahora más limpio gracias a la nueva función L.latLng)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedBusinessId) {
      const business = businessesWithCoords.find(
        (b) => b.id === selectedBusinessId
      );
      
      const rawCoords = business?.coords;
      
      if (map && rawCoords) {
        try { // TRY-CATCH Final
          // Usar parseFloat(String(x)) para la conversión más robusta 
          // y L.latLng para construir el objeto.
          const latLng = L.latLng(
            parseFloat(String(rawCoords[0])), 
            parseFloat(String(rawCoords[1]))
          );

          // Verificar si el objeto L.LatLng es válido ANTES de flyTo
          if (isFinite(latLng.lat) && isFinite(latLng.lng)) {
            
            // Ejecutar el vuelo
            map.flyTo(latLng, 15, { // Línea 308 corregida
              animate: true,
              duration: 10,
            });
            
            const marker = markersRef.current.get(selectedBusinessId);
            if (marker) {
              setTimeout(() => {
                marker.openPopup();
              }, 1000);
            }
          } else {
            console.error("DICILO_MAP_FINAL_FAILURE: L.latLng resultó en NaN. Datos:", rawCoords);
          }
        } catch (error) {
          console.error("DICILO_MAP_CRASH_PREVENTED: Fallo al intentar volar el mapa.", error);
        }
      }
    }
  }, [selectedBusinessId, businessesWithCoords]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default DiciloMap;