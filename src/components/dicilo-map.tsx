// src/components/dicilo-map.tsx
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
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
  // Evita problemas de bundling con Next: usa CDN para los íconos
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

  // Filtramos solo los negocios que tienen coordenadas válidas.
  const businessesWithCoords = useMemo(() => {
    return businesses.filter(
      (b) =>
        b.coords &&
        Array.isArray(b.coords) &&
        b.coords.length === 2 &&
        isFinite(b.coords[0]) &&
        isFinite(b.coords[1])
    );
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

  useEffect(() => {
    const currentMapContainer = mapContainerRef.current;
    if (!currentMapContainer) return;

    if (!mapRef.current) {
      const map = L.map(currentMapContainer, {
        zoomControl: true,
        attributionControl: true,
      }).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 20,
      }).addTo(map);

      mapRef.current = map;

      // Invalida el tamaño del mapa si el contenedor cambia de tamaño
      const ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(currentMapContainer);
      resizeObserverRef.current = ro;
    } else {
      mapRef.current.setView(center, zoom);
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
      if (business.coords) {
        const popupContent = createPopupContent(business, t);
        let marker = markersRef.current.get(business.id);

        if (marker) {
          marker.setLatLng(business.coords);
          marker.getPopup()?.setContent(popupContent);
        } else {
          marker = L.marker(business.coords, {
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
      }
    });
  }, [businessesWithCoords, onMarkerDragEnd, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedBusinessId) {
      const business = businessesWithCoords.find(
        (b) => b.id === selectedBusinessId
      );
      if (business?.coords) {
        map.flyTo(business.coords, 15, {
          animate: true,
          duration: 1,
        });
        const marker = markersRef.current.get(selectedBusinessId);
        if (marker) {
          // Pequeño retraso para asegurar que el popup se abra después de que el mapa se haya movido
          setTimeout(() => {
            marker.openPopup();
          }, 1000);
        }
      }
    }
  }, [selectedBusinessId, businessesWithCoords]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default DiciloMap;
