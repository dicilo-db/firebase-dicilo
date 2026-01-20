// src/components/dicilo-map.tsx
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import L, { Map as LeafletMap, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Business } from '@/components/dicilo-search-page';
import { useTranslation } from 'react-i18next';

interface DiciloMapProps {
  center: [number, number];
  zoom: number;
  businesses: Business[];
  selectedBusinessId?: string | null;
  onMarkerDragEnd?: (newCoords: [number, number]) => void;
}

const DEFAULT_CENTER: LatLngTuple = [50.1109, 8.6821];

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
  t: (key: string) => string,
  locale: string
): string => {
  const isPremium = business.tier_level === 'premium' || business.clientType === 'premium';

  // BASIC CARD (Simple, Clean, Minimalist)
  if (!isPremium) {
    let content = `<div style="padding: 8px; font-family: 'Inter', sans-serif; color: #333; min-width: 260px;">`;
    content += `<h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #111;">${business.name}</h3>`;
    if (business.category) {
      content += `<div style="margin-bottom: 8px; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${business.category.replace(' / ', ' &middot; ')}</div>`;
    }

    // Info Block
    content += `<div style="margin-top: 8px; font-size: 13px; color: #444; line-height: 1.4;">`;
    content += `<div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 4px;"><span style="font-size: 14px;">📍</span> <span>${business.location || ''}</span></div>`;
    if (business.address) {
      content += `<div style="margin-left: 24px; color: #666; margin-bottom: 6px; font-size: 12px;">${business.address}</div>`;
    }
    if (business.phone) {
      content += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;"><span style="font-size: 14px;">📞</span> <span>${business.phone}</span></div>`;
    }
    if (business.email) {
      content += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;"><span style="font-size: 14px;">✉️</span> <a href="mailto:${business.email}" style="color: #444; text-decoration: none;">${business.email}</a></div>`;
    }
    content += `</div>`;

    // Footer Links
    const links = [];
    if (business.website) links.push(`<a href="${business.website}" target="_blank" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">${t('mapPopup.website')}</a>`);
    if (business.mapUrl) links.push(`<a href="${business.mapUrl}" target="_blank" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">${t('mapPopup.map')}</a>`);

    const offerUrl = business.clientSlug ? `/client/${business.clientSlug}` : business.currentOfferUrl;
    if (offerUrl) {
      links.push(`<a href="${offerUrl}" target="_blank" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">${t('businessCard.currentOffer')} &rarr;</a>`);
    }

    if (links.length > 0) {
      content += `<div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; display: flex; gap: 12px;">${links.join(' <span style="color:#ddd">|</span> ')}</div>`;
    }
    content += `</div>`;
    return content;
  }

  // PREMIUM CARD (Redesigned: Blurred Backdrop, Clean Layout, Premium Feel)
  // Using explicit width and resetting generic styles to ensure consistent look
  let content = `<div class="premium-popup-card" style="font-family: 'Inter', system-ui, sans-serif; background: #fff; overflow: hidden; box-sizing: border-box;">`;

  // 1. Header with Blurred Backdrop
  // Using the image (or logo) as a blurred background to create a premium atmosphere regardless of image quality.
  const displayImage = business.coverImageUrl || business.imageUrl;
  content += `<div style="position: relative; height: 140px; overflow: hidden; background: #333;">`;
  // Blurred Background Layer
  if (displayImage) {
    content += `<div style="
            position: absolute; 
            inset: 0; 
            background-image: url('${displayImage}'); 
            background-size: cover; 
            background-position: center; 
            z-index: 1;
        "></div>`;
  } else {
    // Fallback gradient if no image at all
    content += `<div style="position: absolute; inset: 0; background: linear-gradient(135deg, #FFD700, #FDB931); z-index: 1;"></div>`;
  }

  // Premium Badge
  content += `<div style="
        position: absolute; 
        top: 12px; 
        left: 12px; 
        background: linear-gradient(to bottom right, #FFD700, #FDB931); 
        color: #7b5804; 
        padding: 4px 10px; 
        border-radius: 4px; 
        font-size: 11px; 
        font-weight: 800; 
        letter-spacing: 0.5px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3); 
        z-index: 2;
        border: 1px solid rgba(255,255,255,0.4);
    ">PREMIUM PARTNER</div>`;

  // Logo Circle (floating on the boundary)
  const logoImg = business.clientLogoUrl || business.imageUrl;
  content += `<div style="
        position: absolute; 
        bottom: -20px; 
        right: 20px; 
        width: 64px; 
        height: 64px; 
        border-radius: 50%; 
        border: 4px solid #fff; 
        background: #fff; 
        overflow: hidden; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
        z-index: 10;
        display: flex; align-items: center; justify-content: center;
    ">
        <img src="${logoImg}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo">
    </div>`;
  content += `</div>`; // End Header

  // 2. Body Content
  content += `<div style="padding: 24px 20px 20px 20px; background: #fff;">`;

  // Title & Category
  content += `<h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #111; line-height: 1.3; padding-right: 50px;">${business.name}</h3>`;
  if (business.category) {
    content += `<div style="margin: 6px 0 12px 0; font-size: 11px; color: #d97706; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${business.category}</div>`;
  }

  // Description (Truncated)
  const description = business.description_translations?.[locale as 'en' | 'es' | 'de'] || business.description || '';
  if (description) {
    content += `<p style="font-size: 13px; color: #555; line-height: 1.6; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; max-height: 4.8em;">${description}</p>`;
  }

  // Contact Details (Grid with Icons)
  content += `<div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 13px; color: #444; margin-bottom: 20px;">`;
  // Location
  content += `<div style="display: flex; align-items: flex-start; gap: 10px;">
        <span style="font-size: 15px; min-width: 18px;">📍</span> 
        <div style="flex: 1;">
            <span style="font-weight: 600; color: #333;">${business.location}</span>
            ${business.address ? `<div style="color: #666; font-size: 12px; margin-top: 2px;">${business.address}</div>` : ''}
        </div>
    </div>`;

  // Phone
  if (business.phone) {
    content += `<div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 15px; min-width: 18px;">📞</span> 
            <span>${business.phone}</span>
        </div>`;
  }

  // Email
  if (business.email) {
    content += `<div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 15px; min-width: 18px;">✉️</span> 
            <a href="mailto:${business.email}" style="color: #333; text-decoration: none; border-bottom: 1px dotted #999;">${business.email}</a>
        </div>`;
  }
  content += `</div>`;

  // Action Buttons
  content += `<div style="display: flex; gap: 10px;">`;

  if (business.website) {
    content += `<a href="${business.website}" target="_blank" style="
           flex: 1; 
           text-align: center; 
           background: #fff; 
           border: 1px solid #e5e7eb; 
           color: #374151; 
           padding: 10px 0; 
           border-radius: 6px; 
           text-decoration: none; 
           font-size: 12px; 
           font-weight: 600; 
           transition: background 0.2s;
       ">${t('mapPopup.website').toUpperCase()}</a>`;
  }

  if (business.mapUrl) {
    content += `<a href="${business.mapUrl}" target="_blank" style="
           flex: 1; 
           text-align: center; 
           background: #fff; 
           border: 1px solid #e5e7eb; 
           color: #374151; 
           padding: 10px 0; 
           border-radius: 6px; 
           text-decoration: none; 
           font-size: 12px; 
           font-weight: 600;
       ">${t('mapPopup.map').toUpperCase()}</a>`;
  }

  const offerUrl = business.clientSlug ? `/client/${business.clientSlug}` : business.currentOfferUrl;
  if (offerUrl) {
    content += `<a href="${offerUrl}" target="_blank" style="
          flex: 2; 
          text-align: center; 
          background: linear-gradient(to right, #f59e0b, #d97706); 
          color: white; 
          padding: 10px 0; 
          border-radius: 6px; 
          text-decoration: none; 
          font-size: 12px; 
          font-weight: 600; 
          box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
          text-transform: uppercase;
      ">${t('businessCard.currentOffer')}</a>`;
  }

  content += `</div>`; // End buttons
  content += `</div></div>`; // End body & container

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
}) => {
  const { t, i18n } = useTranslation('common');
  const locale = i18n.language?.split('-')[0] || 'de';
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
          return null;
        }
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
      const popupContent = createPopupContent(business, t, locale);
      let marker = markersRef.current.get(business.id);

      if (marker) {
        marker.setLatLng(business.coords);
        marker.unbindPopup();
        // Increasing limits to allow our CSS to control width
        marker.bindPopup(popupContent, { minWidth: 280, maxWidth: 450 });
      } else {
        marker = L.marker(business.coords, { draggable: !!onMarkerDragEnd })
          .addTo(map)
          .bindPopup(popupContent, { minWidth: 280, maxWidth: 450 });

        if (onMarkerDragEnd) {
          marker.on('dragend', function (event) {
            const newLatLng = event.target.getLatLng();
            onMarkerDragEnd([newLatLng.lat, newLatLng.lng]);
          });
        }
        markersRef.current.set(business.id, marker);
      }
    });
  }, [businessesWithCoords, onMarkerDragEnd, t, locale]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBusinessId) return;

    const business = businessesWithCoords.find(
      (b) => b.id === selectedBusinessId
    );
    if (!business) return;

    const validCoords = business.coords as LatLngTuple;

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
        'DICILO_MAP_CRITICAL_ERROR: Datos de vuelo corruptos.',
        validCoords
      );
    }
  }, [selectedBusinessId, businessesWithCoords]);

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

  return (
    <div className="relative h-full w-full">
      <style jsx global>{`
            /* Fix for Tailwind vs Leaflet tile conflict */
            .leaflet-tile {
               max-width: none !important;
               max-height: none !important;
            }
            /* Custom Scrollbar for popup description if needed */
            .leaflet-popup-content-wrapper {
                padding: 0 !important;
                border-radius: 8px !important;
                overflow: hidden !important;
            }
            .leaflet-popup-content {
                margin: 0 !important;
                width: auto !important;
            }
            
            /* Responsive Premium Popup */
            .premium-popup-card {
                width: 280px; /* Small mobile default */
            }
            @media (min-width: 360px) {
                .premium-popup-card {
                    width: 320px;
                }
            }
            @media (min-width: 480px) {
                .premium-popup-card {
                    width: 420px; /* Desktop/Tablet ideal premium width */
                }
            }
          `}</style>
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

export default DiciloMap;
