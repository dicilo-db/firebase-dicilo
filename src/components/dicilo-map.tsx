// src/components/dicilo-map.tsx
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
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

const DEFAULT_CENTER: LatLngTuple = [50.1109, 8.6821];
const DEFAULT_ZOOM = 10;

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
  if (business.address) content += `<p>${business.address}</p>`;
  if (business.phone) content += `<p>${business.phone}</p>`;

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
  const lat = parseFloat(String(coords[0]));
  const lng = parseFloat(String(coords[1]));

  if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return [lat, lng];
  }
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

  // Nivel 1: Saneamiento de datos en el origen con useMemo.
  const businessesWithCoords = useMemo(() => {
    return businesses
      .map((business) => {
        const validCoords = validateAndParseCoords(business.coords);
        if (!validCoords) {
          return null; // Descarta el negocio si las coordenadas son inválidas.
        }
        // Devuelve un objeto con las coordenadas ya validadas y parseadas.
        return { ...business, coords: validCoords };
      })
      .filter((b): b is Business & { coords: LatLngTuple } => b !== null);
  }, [businesses]);

  useEffect(() => {
    fixLeafletDefaultIcons();
  }, []);

  useEffect(() => {
    const currentMapContainer = mapContainerRef.current;
    if (!currentMapContainer) return;

    const isCenterValid = Number.isFinite(center[0]) && Number.isFinite(center[1]);
    const safeCenter: LatLngTuple = isCenterValid ? center : DEFAULT_CENTER;

    if (!mapRef.current) {
      try {
        const map = L.map(currentMapContainer, {
          zoomControl: true,
          attributionControl: true,
        }).setView(safeCenter, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 20,
        }).addTo(map);

        mapRef.current = map;

        const ro = new ResizeObserver(() => map.invalidateSize());
        ro.observe(currentMapContainer);
        resizeObserverRef.current = ro;
      } catch (e) {
        console.error("DICILO_MAP_INIT_CRASH_PREVENTED: Fallo al inicializar el mapa con setView.", e);
        return;
      }
    } else {
      mapRef.current.setView(safeCenter, zoom);
    }

    return () => {
      if (resizeObserverRef.current && currentMapContainer) {
        resizeObserverRef.current.unobserve(currentMapContainer);
      }
    };
  }, [center, zoom]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const displayedMarkerIds = new Set(markersRef.current.keys());
    const businessesToDisplayIds = new Set(businessesWithCoords.map((b) => b.id));

    displayedMarkerIds.forEach((id) => {
      if (!businessesToDisplayIds.has(id)) {
        markersRef.current.get(id)?.remove();
        markersRef.current.delete(id);
      }
    });

    businessesWithCoords.forEach((business) => {
      const popupContent = createPopupContent(business, t);
      let marker = markersRef.current.get(business.id);

      if (marker) {
        marker.setLatLng(business.coords);
        marker.getPopup()?.setContent(popupContent);
      } else {
        marker = L.marker(business.coords, { draggable: !!onMarkerDragEnd })
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
    });
  }, [businessesWithCoords, onMarkerDragEnd, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBusinessId) return;

    const business = businessesWithCoords.find(
      (b) => b.id === selectedBusinessId
    );
    if (!business) return;

    const validCoords = business.coords as LatLngTuple; // Sabemos que está validado por useMemo

    // Última línea de defensa: validación final antes de la animación
    if (
      Array.isArray(validCoords) &&
      validCoords.length === 2 &&
      Number.isFinite(validCoords[0]) &&
      Number.isFinite(validCoords[1])
    ) {
      try {
        map.flyTo(validCoords, 15, {
          animate: true,
          duration: 1,
        });
      } catch (error) {
        console.error('DICILO_MAP_ERROR: flyTo failed', error);
        map.setView(validCoords, 15);
      }

      const marker = markersRef.current.get(selectedBusinessId);
      if (marker) {
        setTimeout(() => marker.openPopup(), 1000);
      }
    } else {
      console.error(
        'DICILO_MAP_CRITICAL_ERROR: Datos de vuelo corruptos en el último chequeo. Coords:',
        validCoords
      );
    }
  }, [selectedBusinessId, businessesWithCoords]);

  // Efecto para manejar los clics en los popups para analíticas
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.hasAttribute('data-analytics-type')) {
        const businessId = target.getAttribute('data-analytics-business-id');
        const businessName = target.getAttribute('data-analytics-business-name');
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

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default DiciloMap;
